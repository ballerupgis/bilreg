import requests
import json

CONST_BASEURL = "https://ballerup.mapcentia.com/api/v2/sql/collector"

def get_table_content(table):
    params = {
        'key':'73a7b92465313debc7533b5019f7af58',
        'q':'SELECT * FROM {}'.format(table)
    }

    r = requests.get(CONST_BASEURL, params=params)
    jsondata = json.loads(r.text)
    return jsondata

if __name__ == '__main__':
    for item in get_table_content('lora_flaadestyring.bil_bilreg_euid')['features']:
        p = item['properties']
        print('Bilreg: {0} \neui: {1} \n'.format(p['bilreg'], p['eui']))
