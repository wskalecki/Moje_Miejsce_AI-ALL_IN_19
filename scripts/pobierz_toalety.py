#!/usr/bin/env python3
"""Pobieranie toalet; wyłącznie biblioteka standardowa, bez logowania sekretów."""
import argparse
import json
import os
from pathlib import Path
import ssl
import sys
import urllib.error
import urllib.request

ENDPOINT = 'https://dane.um.warszawa.pl/api/action/get_m_toalety'


def reject_constant(value):
    raise ValueError('Niedozwolona stała JSON')


def parse(text):
    return json.loads(text, parse_constant=reject_constant)


def collection(value):
    if isinstance(value, dict) and value.get('type') == 'FeatureCollection':
        features = value.get('features')
    elif isinstance(value, dict) and value.get('type') == 'Feature':
        features = [value]
    elif isinstance(value, list):
        features = value
    else:
        raise ValueError('Nieznana struktura odpowiedzi; brak Feature/FeatureCollection')
    if not isinstance(features, list):
        raise ValueError('Pole features nie jest listą')
    for feature in features:
        if not isinstance(feature, dict) or feature.get('type') != 'Feature':
            raise ValueError('Niepoprawny obiekt Feature')
        if 'properties' not in feature or not (feature['properties'] is None or isinstance(feature['properties'], dict)):
            raise ValueError('Niepoprawne properties')
        if 'geometry' not in feature:
            raise ValueError('Brak geometry')
        geom = feature['geometry']
        # Zbiór opisuje toalety jako punkty WGS84.
        if geom is not None:
            if not isinstance(geom, dict) or geom.get('type') != 'Point':
                raise ValueError('Oczekiwano geometrii Point')
            coords = geom.get('coordinates')
            if not isinstance(coords, list) or len(coords) < 2 or not all(type(n) in (int, float) for n in coords):
                raise ValueError('Niepoprawne współrzędne')
            if not (-180 <= coords[0] <= 180 and -90 <= coords[1] <= 90):
                raise ValueError('Współrzędne poza zakresem WGS84')
    return {'type': 'FeatureCollection', 'features': features}


def decode_response(raw):
    text = raw.decode('utf-8-sig').strip()
    try:
        return collection(parse(text))
    except json.JSONDecodeError:
        # Obsługa sekwencji Feature rozdzielonych białymi znakami lub przecinkami.
        decoder = json.JSONDecoder(parse_constant=reject_constant)
        features, pos = [], 0
        while pos < len(text):
            obj, pos = decoder.raw_decode(text, pos)
            if not isinstance(obj, dict) or obj.get('type') != 'Feature':
                raise ValueError('Niepoprawna sekwencja Feature')
            features.append(obj)
            while pos < len(text) and text[pos].isspace():
                pos += 1
            if pos < len(text) and text[pos] == ',':
                pos += 1
                while pos < len(text) and text[pos].isspace():
                    pos += 1
        return collection(features)


def inspect(path):
    value = parse(path.read_text(encoding='utf-8-sig'))
    if not isinstance(value, dict) or value.get('type') != 'FeatureCollection':
        raise ValueError('Zapisany plik nie jest FeatureCollection')
    result = collection(value)
    fields = sorted({k for f in result['features'] for k in (f['properties'] or {})})
    print(json.dumps({'plik': str(path), 'rekordy': len(result['features']),
                      'pola_properties': fields}, ensure_ascii=False))
    return result


def save(path, value):
    if path.exists():
        existing = inspect(path)
        if existing != value:
            raise ValueError('Istniejący plik różni się od pobranych danych; nie nadpisano')
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    # Tryb x chroni również przed nadpisaniem pliku utworzonego w międzyczasie.
    with path.open('x', encoding='utf-8') as handle:
        json.dump(value, handle, ensure_ascii=False, allow_nan=False, indent=2)
        handle.write('\n')
    if inspect(path) != value:
        raise ValueError('Weryfikacja zapisanego pliku nie powiodła się')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Sekret nigdy nie trafia do innego adresu po przekierowaniu.
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--key-file', type=Path, default=Path('apiKey.txt'))
    parser.add_argument('--sample-size', type=int, default=5)
    parser.add_argument('--data-dir', type=Path, default=Path('data'))
    parser.add_argument('--ca-file', type=Path, help='Zaufany pakiet CA; weryfikacja TLS pozostaje włączona')
    args = parser.parse_args()
    if args.sample_size < 1:
        raise ValueError('Rozmiar próbki musi być dodatni')
    sample_path = args.data_dir / 'toalety_test.geojson'
    full_path = args.data_dir / 'toalety.geojson'
    for path in (sample_path, full_path):
        if path.exists():
            inspect(path)
    key = os.environ.get('UM_WARSZAWA_API_KEY', '').strip()
    if not key:
        if not args.key_file.is_file():
            raise ValueError('Brak klucza. Podaj ścieżkę przez --key-file lub ustaw UM_WARSZAWA_API_KEY')
        key = args.key_file.read_text(encoding='utf-8-sig').strip()
    if not key or any(c.isspace() for c in key):
        raise ValueError('Klucz jest pusty lub zawiera białe znaki')
    context = ssl.create_default_context(cafile=str(args.ca_file) if args.ca_file else None)
    opener = urllib.request.build_opener(NoRedirect(), urllib.request.HTTPSHandler(context=context))
    request = urllib.request.Request(ENDPOINT, data=b'', method='POST',
                                     headers={'Authorization': key, 'Accept': 'application/json'})
    with opener.open(request, timeout=90) as response:
        full = decode_response(response.read())
    if not full['features']:
        raise ValueError('API zwróciło pusty zbiór; nie zapisano danych')
    sample = {'type': 'FeatureCollection', 'features': full['features'][:args.sample_size]}
    save(sample_path, sample)
    # Pełna odpowiedź jest już w pamięci; zapis dopiero po walidacji próbki.
    save(full_path, full)


if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as exc:
        print(f'Błąd API: HTTP {exc.code}; treść odpowiedzi pominięta.', file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as exc:
        reason = 'weryfikacja certyfikatu TLS' if isinstance(exc.reason, ssl.SSLCertVerificationError) else 'połączenie sieciowe'
        print(f'Błąd API: {reason}; szczegóły pominięte.', file=sys.stderr)
        sys.exit(1)
    except (OSError, ValueError, UnicodeError) as exc:
        # Nie drukujemy wyjątku: może zawierać fragment odpowiedzi lub sekretu.
        print(f'Nie ukończono: {type(exc).__name__}. Sprawdź klucz, pliki i format danych; istniejących plików nie nadpisano.', file=sys.stderr)
        sys.exit(1)
