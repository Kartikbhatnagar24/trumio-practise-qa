PASSWORD = 'Claimly@2026'
ASHA = 'asha.verma@claimly.in'
VIKRAM = 'vikram.nair@claimly.in'
RAHUL = 'rahul.mehta@claimly.in'
KAVITA = 'kavita.rao@claimly.in'
NEHA = 'neha.iyer@claimly.in'


FULL_ALTERNATE = {
    'api': {'claims_path': 'expenses', 'amount_field': 'claim_amount', 'merchant_field': 'vendor', 'date_field': 'spent_on'},
    'rules': {
        'hotel_nightly_limit': 6500,
        'meal_cap_by_grade': {'G1': 700, 'G2': 1100, 'G3': 1600},
        'max_claim_age_days': 45,
        'receipt_required_from': 1500,
        'manager_approval_limit': 25000,
    },
    'ui': {'category_picker': 'combobox', 'date_input': 'typed', 'submit_label': 'send_for_approval', 'column_order': 'amount_first', 'step_order': 'receipt_first'},
}


def draft(**overrides) -> dict:
    return {'category': 'MEALS', 'currency': 'INR', 'amount': '450.00', 'merchant': 'Truffles Cafe', 'expense_date': '2026-06-10', 'description': 'Team lunch', **overrides}


def create_draft(client, headers: dict, **overrides) -> dict:
    response = client.post('/claims', json=draft(**overrides), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def login(client, email: str) -> dict:
    response = client.post('/auth/login', json={'email': email, 'password': PASSWORD})
    assert response.status_code == 200, response.text
    return {'Authorization': f'Bearer {response.json()["access_token"]}'}
