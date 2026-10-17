"""Persona weight profiles (0–3 per metric key). Copy from docs/core/koncept-aplikacji.md + senior.

Weights reference metric keys; a key with no data in a cell is skipped and the
remaining weights are re-normalised, so personas keep working as data grows.
"""

from __future__ import annotations

PERSONAS: dict[str, dict] = {
    "kasia": {
        "label": "Kasia — spokój na obrzeżach",
        "weights": {
            "park_dist_m": 3,
            "aq_pm25_idw": 3,
            "noise_lden_db": 3,
            "rcn_m2_median_district": 3,
            "traffic_disruptions_1km": 2,
            "crime_rate_district": 2,
            "supermarket_dist_m": 1,
            "pharmacy_dist_m": 1,
            "metro_dist_m": 1,
            "kindergarten_dist_m": 1,
            "playgrounds_1km": 1,
            "gastronomy_1km": 0.5,
            "events_30d": 0.5,
        },
    },
    "marek": {
        "label": "Marek — życie na scenie",
        "weights": {
            "events_30d": 3,
            "gastronomy_1km": 3,
            "metro_dist_m": 3,
            "tram_stops_1km": 2,
            "transit_stops_count": 2,
            "library_dist_m": 1,
            "park_dist_m": 1,
            "aq_pm25_idw": 1,
            "rcn_m2_median_district": 1,
        },
    },
    "ania_tomek": {
        "label": "Ania i Tomek — rodzina w ruchu",
        "weights": {
            "kindergarten_dist_m": 3,
            "school_dist_m": 3,
            "playgrounds_1km": 2,
            "toilets_with_changing_table": 2,
            "sport_places": 2,
            "park_dist_m": 2,
            "aq_pm25_idw": 2,
            "transit_stops_count": 2,
            "clinic_dist_m": 2,
            "rcn_m2_median_district": 2,
            "crime_rate_district": 2,
            "metro_dist_m": 1,
            "pharmacy_dist_m": 1,
            "highschool_dist_m": 1,
            "supermarket_dist_m": 1,
            "events_30d": 1,
        },
    },
    "senior": {
        "label": "Pan Janusz — senior blisko wszystkiego",
        "weights": {
            "clinic_dist_m": 3,
            "pharmacy_dist_m": 3,
            "transit_stops_count": 3,
            "park_dist_m": 2,
            "aq_pm25_idw": 2,
            "noise_lden_db": 2,
            "toilet_accessible_dist_m": 2,
            "utw_dist_m": 2,
            "supermarket_dist_m": 2,
            "crime_rate_district": 2,
            "aed_dist_m": 2,
            "library_dist_m": 1,
            "tram_stops_1km": 1,
            "events_30d": 1,
        },
    },
}

# Personas required by the team contract (validate_data.py); extra ones are allowed
CONTRACT_PERSONAS = ("kasia", "marek", "ania_tomek")
