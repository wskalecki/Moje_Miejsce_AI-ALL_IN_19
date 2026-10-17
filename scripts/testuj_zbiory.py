#!/usr/bin/env python3
"""Testy odczytu API katalogu Warszawy. Nie wykonuje poleceń z dokumentacji."""
import argparse
from collections import Counter
from datetime import datetime
import json
import os
from pathlib import Path
import re
import ssl
import time
import urllib.request
import urllib.error
from zoneinfo import ZoneInfo
from pobierz_toalety import NoRedirect, parse

BASE = 'https://dane.um.warszawa.pl'
MAX_BYTES = 40 * 1024 * 1024


def records(value):
    if isinstance(value, list): return value, 'list'
    if isinstance(value, dict):
        if value.get('type') == 'FeatureCollection': return value['features'], 'geojson'
        if value.get('type') == 'Feature': return [value], 'geojson'
        for field in ('result', 'results', 'data', 'items', 'carParks'):
            if field in value:
                rows, kind = records(value[field])
                return rows, kind
        if value and all(isinstance(v, list) for v in value.values()):
            return [{'collection': k, 'value': r} for k, group in value.items() for r in group], 'grouped'
        return [value], 'object'
    raise ValueError('Nieznana struktura')


def decode(raw):
    text = raw.decode('utf-8-sig').strip()
    try: return parse(text)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()
        rows, pos = [], 0
        while pos < len(text):
            obj, pos = decoder.raw_decode(text, pos)
            if not isinstance(obj, dict) or obj.get('type') != 'Feature': raise ValueError()
            rows.append(obj)
            while pos < len(text) and text[pos].isspace(): pos += 1
            if pos < len(text) and text[pos] == ',':
                pos += 1
                while pos < len(text) and text[pos].isspace(): pos += 1
        return {'type': 'FeatureCollection', 'features': rows}


def write_verified(path, value):
    with path.open('x', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=False, indent=2, allow_nan=False)
        f.write('\n')
    if parse(path.read_text(encoding='utf-8')) != value: raise ValueError('Błąd weryfikacji zapisu')


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--key-file',type=Path,default=Path('apiKey.txt'))
    p.add_argument('--ca-file', default=None, help='Opcjonalny pakiet zaufanych CA')
    a=p.parse_args()
    key=os.environ.get('UM_WARSZAWA_API_KEY','').strip() or a.key_file.read_text(encoding='utf-8-sig').strip()
    if not key or any(c.isspace() for c in key): raise ValueError('Niepoprawny klucz')
    opener=urllib.request.build_opener(NoRedirect(),urllib.request.HTTPSHandler(context=ssl.create_default_context(cafile=a.ca_file)))
    def fetch(url,body=None,auth=False):
        headers={'Accept':'application/json'}
        if auth:
            if not re.fullmatch(re.escape(BASE)+r'/api/action/get_[a-z0-9_]+',url): raise ValueError('Nieznany endpoint')
            headers.update({'Authorization':key,'Content-Type':'application/json'})
        req=urllib.request.Request(url,data=body,headers=headers,method='POST' if auth else 'GET')
        with opener.open(req,timeout=30) as r:
            raw=r.read(MAX_BYTES+1)
            if len(raw)>MAX_BYTES: raise OverflowError()
            return raw,r.status
    stamp=datetime.now(ZoneInfo('Europe/Warsaw')).strftime('%Y%m%d-%H%M%S')
    out=Path('data')/('testy-'+stamp);out.mkdir(parents=True,exist_ok=False)
    listing=parse(fetch(BASE+'/api/datasets?page=1&size=100&lang=pl')[0].decode('utf-8-sig'))['result']
    items=listing['results']; page=1
    while len(items)<listing['count']:
        page+=1
        batch=parse(fetch(BASE+f'/api/datasets?page={page}&size=100&lang=pl')[0].decode('utf-8-sig'))['result']['results']
        if not batch: raise ValueError('Niepełny katalog')
        items.extend(batch)
    if len({i['id'] for i in items})!=listing['count']: raise ValueError('Niepełny katalog')
    results=[]
    for item in items:
        row={'id':item['id'],'title':item['title'],'catalogue':BASE+'/pl/catalogue/'+item['id']}
        started=time.monotonic()
        try:
            detail=parse(fetch(BASE+'/api/datasets/'+item['id']+'?lang=pl')[0].decode('utf-8-sig'))
            docs=parse(fetch(detail['call_examples'])[0].decode('utf-8-sig'))
            examples=[e['content'] for s in docs if 'wywoł' in s.get('section_name','').lower() for e in s.get('section_elements',[])]
            example=examples[0]
            endpoint=re.search(r'https?://dane\.um\.warszawa\.pl/api/action/get_[a-z0-9_]+',example).group().replace('http://','https://')
            match=re.search(r"--data(?:-raw)?\s+'(.*?)'",example,re.S)
            params=parse(match.group(1)) if match else None
            row.update(endpoint=endpoint,method='POST',parameters=params)
            body=json.dumps(params).encode() if params is not None else b''
            raw,status=fetch(endpoint,body,True)
            row.update(http_status=status,response_bytes=len(raw))
            value=decode(raw)
            # Nie zapisujemy odpowiedzi zawierającej odbity sekret.
            if key in json.dumps(value,ensure_ascii=False): raise ValueError('Odbity sekret')
            if isinstance(value,dict) and (value.get('success') is False or value.get('error') or value.get('errors')):
                row['status']='API_ERROR'
                row['response_fields']=sorted(value)
            else:
                rows,kind=records(value)
                row['records_in_response']=len(rows)
                row['fields']=sorted({k for r in rows if isinstance(r,dict) for k in r})
                if kind == 'grouped':
                    row['groups']={k:len(v) for k,v in value.items()}
                    row['group_fields']={k:sorted({f for r in v if isinstance(r,dict) for f in r}) for k,v in value.items()}
                geo=kind=='geojson' or bool(rows) and all(isinstance(r,dict) and r.get('type')=='Feature' for r in rows)
                if geo:
                    if not all('geometry' in r and 'properties' in r for r in rows): raise ValueError('Niepoprawne Feature')
                    row['property_fields']=sorted({k for r in rows for k in (r.get('properties') or {})})
                    sample={'type':'FeatureCollection','features':rows[:5]}
                else: sample=rows[:5]
                path=out/(item['name']+('_test.geojson' if geo else '_test.json'))
                write_verified(path,sample)
                row.update(status='OK' if rows else 'EMPTY',sample_records=min(len(rows),5),sample_path=str(path),format='GeoJSON' if geo else 'JSON')
        except urllib.error.HTTPError as e: row.update(status='HTTP_ERROR',http_status=e.code)
        except urllib.error.URLError: row.update(status='NETWORK_ERROR')
        except TimeoutError: row.update(status='TIMEOUT')
        except OverflowError: row.update(status='RESPONSE_TOO_LARGE',limit_bytes=MAX_BYTES)
        except Exception as e: row.update(status='VALIDATION_ERROR',error_type=type(e).__name__)
        row['seconds']=round(time.monotonic()-started,2)
        results.append(row)
        print(json.dumps({'title':row['title'],'status':row['status'],'records':row.get('records_in_response'),'http':row.get('http_status')},ensure_ascii=False),flush=True)
        time.sleep(.3)
    report={'checked_at':datetime.now(ZoneInfo('Europe/Warsaw')).isoformat(),'catalogue_count':listing['count'],'tested_count':len(results),'scope':'Pierwszy udokumentowany przykład na zbiór; maksymalnie 5 zapisanych rekordów. Liczba rekordów dotyczy odpowiedzi, nie pełnego zasobu.','summary':dict(Counter(r['status'] for r in results)),'results':results}
    write_verified(out/'raport.json',report)
    lines=['# Testy Warsaw Open Data','',report['scope'],'',f"Zbiory: {len(results)} / {listing['count']}",'','| Zbiór | Status | HTTP | Rekordy odpowiedzi |','|---|---|---|---|']
    for r in results: lines.append(f"| {r['title']} | {r['status']} | {r.get('http_status','—')} | {r.get('records_in_response','—')} |")
    lines+=['','## Pola odpowiedzi','']
    for r in results: lines += [f"### {r['title']}", '', ', '.join(r.get('property_fields',r.get('fields',[]))) or 'Brak zweryfikowanych pól.', '']
    (out/'raport.md').write_text('\n'.join(lines),encoding='utf-8')
    print(json.dumps({'report':str(out/'raport.json'),'summary':report['summary']},ensure_ascii=False))

if __name__=='__main__':
    try: main()
    except Exception as e:
        print('Przerwano testy:',type(e).__name__)
        raise SystemExit(1)
