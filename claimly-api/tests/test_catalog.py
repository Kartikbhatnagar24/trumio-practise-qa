import json

import pytest

from app.core.config import ROOT
from app.core.variant import DEFAULT_VARIANT
from app.static import enums
from app.static.bugs import UI_BUG_CODES, Bug

SLOT_ENUMS = {
    ('api', 'claims_path'): enums.ClaimsPath,
    ('api', 'amount_field'): enums.AmountField,
    ('api', 'merchant_field'): enums.MerchantField,
    ('api', 'date_field'): enums.DateField,
    ('ui', 'category_picker'): enums.CategoryPicker,
    ('ui', 'date_input'): enums.DateInput,
    ('ui', 'submit_label'): enums.SubmitLabel,
    ('ui', 'column_order'): enums.ColumnOrder,
    ('ui', 'step_order'): enums.StepOrder,
}


@pytest.fixture
def catalog():
    return json.loads((ROOT.parent / 'catalog' / 'claimly.json').read_text(encoding='utf-8'))


def test_every_bug_listed_once_with_layer(catalog):
    listed = [(bug['code'], bug['layer']) for bug in catalog['bugs']]
    expected = [(bug.value, 'api') for bug in Bug] + [(code, 'ui') for code in UI_BUG_CODES]
    assert sorted(listed) == sorted(expected)


def test_bug_entries_are_complete(catalog):
    for bug in catalog['bugs']:
        assert bug['tier'] in {'junior', 'mid', 'senior'}
        assert all(bug[key] for key in ('name', 'flow', 'trigger', 'expected', 'actual'))


def test_every_enum_option_in_slots(catalog):
    for (group, slot), enum in SLOT_ENUMS.items():
        assert sorted(catalog['slots'][group][slot]) == sorted(item.value for item in enum)


def test_default_matches_api(catalog):
    assert catalog['default'] == DEFAULT_VARIANT.model_dump(mode='json')


def test_rule_ranges_contain_defaults(catalog):
    rules = catalog['slots']['rules']
    defaults = DEFAULT_VARIANT.model_dump(mode='json')['rules']
    for name, value in defaults.items():
        ranges = rules[name] if name != 'meal_cap_by_grade' else None
        if ranges is None:
            for grade, cap in value.items():
                band = rules[name][grade]
                assert band['min'] <= cap <= band['max'] and (cap - band['min']) % band['step'] == 0
        else:
            assert ranges['min'] <= value <= ranges['max'] and (value - ranges['min']) % ranges['step'] == 0
