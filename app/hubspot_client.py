import os
import requests
from typing import Optional, Dict, Any

class HubSpotClient:
    BASE_URL = "https://api.hubapi.com"

    def __init__(self, private_app_token: str, app_env: str = "dev") -> None:
        self.token = private_app_token
        self.app_env = app_env

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def enabled(self) -> bool:
        return bool(self.token) and self.app_env == "prod"

    def upsert_contact(self, email: str, firstname: Optional[str], lastname: Optional[str], marketing_consent: bool) -> Optional[str]:
        if not self.enabled():
            # Mocked response in dev
            return f"mock-{abs(hash(email)) % 10_000_000}"

        # Search contact
        search_url = f"{self.BASE_URL}/crm/v3/objects/contacts/search"
        payload = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "email", "operator": "EQ", "value": email}
                    ]
                }
            ],
            "properties": ["email"],
            "limit": 1,
        }
        resp = requests.post(search_url, headers=self._headers(), json=payload, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        if results:
            return results[0]["id"]

        # Create contact
        create_url = f"{self.BASE_URL}/crm/v3/objects/contacts"
        properties = {
            "email": email,
            "firstname": firstname or "",
            "lastname": lastname or "",
            "slot_signup": True,
            "marketing_consent": marketing_consent,
        }
        resp = requests.post(create_url, headers=self._headers(), json={"properties": properties}, timeout=15)
        resp.raise_for_status()
        return resp.json().get("id")

    def create_note(self, contact_id: str, text: str) -> Optional[str]:
        if not self.enabled():
            return f"mock-note-{abs(hash((contact_id, text))) % 10_000_000}"
        url = f"{self.BASE_URL}/crm/v3/objects/notes"
        payload = {
            "properties": {
                "hs_note_body": text,
            },
            "associations": [
                {
                    "to": {"id": contact_id},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": 190,  # Note to Contact
                        }
                    ],
                }
            ],
        }
        resp = requests.post(url, headers=self._headers(), json=payload, timeout=15)
        resp.raise_for_status()
        return resp.json().get("id")

    def create_deal(self, contact_id: str, pipeline_id: str, stage_id: str, deal_name: str) -> Optional[str]:
        if not self.enabled():
            return f"mock-deal-{abs(hash(contact_id)) % 10_000_000}"
        url = f"{self.BASE_URL}/crm/v3/objects/deals"
        payload = {
            "properties": {
                "dealname": deal_name,
                "pipeline": pipeline_id,
                "dealstage": stage_id,
            },
            "associations": [
                {
                    "to": {"id": contact_id},
                    "types": [
                        {
                            "associationCategory": "HUBSPOT_DEFINED",
                            "associationTypeId": 3,  # Contact to Deal
                        }
                    ],
                }
            ],
        }
        resp = requests.post(url, headers=self._headers(), json=payload, timeout=15)
        resp.raise_for_status()
        return resp.json().get("id")
