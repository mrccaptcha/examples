async function generateMSSignupBlob(client) {
  const generatePrepareData = async () => {
    try {
      const {data, headers} = await client({
        url: 'https://signup.live.com/signup?lic=1',
        method: 'GET',
      });

      const canary = (data).match(/"apiCanary":"([^"]+)/i)?.[1];
      const tcxt = (data).match(/"tcxt":"([^"]+)/i)?.[1];
      const uaid = (data).match(/"uaid":"([^"]+)/i)?.[1];
      const urlDfp = (data).match(/"urlDfp":"([^"]+)/i)?.[1];

      await client({
        method: 'GET',
        url: urlDfp,
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
          'priority': 'u=0, i', 
          'referer': 'https://signup.live.com/', 
          'sec-fetch-dest': 'iframe', 
          'sec-fetch-mode': 'navigate', 
          'sec-fetch-site': 'same-site', 
          'upgrade-insecure-requests': '1'
        }
      });

      const prepareData = {
        canary: decodeURIComponent(JSON.parse(`"${canary}"`)),
        cookie: headers['set-cookie'][0].split(';')[0],
        tcxt: decodeURIComponent(JSON.parse(`"${tcxt}"`)),
        uaid
      };

      return prepareData;
    }
    catch(error) {
      throw new Error(`Generate prepare data error: ${error.message}`);
    }
  }

  const generateBlob = async (prepareData) => {
    try {
      const {data} = await client({
        method: 'POST',
        url: 'https://signup.live.com/API/CreateAccount?lic=1',
        headers: { 
          'accept': '*/*', 
          'canary': prepareData.canary, 
          'Content-Type': 'application/json', 
          'origin': 'https://signup.live.com', 
          'priority': 'u=1, i', 
          'sec-fetch-dest': 'empty', 
          'sec-fetch-mode': 'cors', 
          'sec-fetch-site': 'same-origin', 
          'tcxt': 'undefined', 
          'uiflvr': '1001', 
          'x-ms-apitransport': 'xhr', 
          'x-ms-apiversion': '2', 
          'Host': 'signup.live.com', 
          'Cookie': prepareData.cookie + '; mkt1=vi-VN'
        },
        data : {
          "BirthDate": "15:11:1999",
          "CheckAvailStateMap": [
              "sonlian243242@hmail.com:false",
              "sonlian243242@hotmail.com:false"
          ],
          "Country": "VN",
          "EvictionWarningShown": [],
          "FirstName": "lina",
          "IsRDM": false,
          "IsOptOutEmailDefault": true,
          "IsOptOutEmailShown": 1,
          "IsOptOutEmail": true,
          "IsUserConsentedToChinaPIPL": false,
          "LastName": "son",
          "LW": 1,
          "MemberName": "sonlian243242@hotmail.com",
          "RequestTimeStamp": "2025-03-12T14:42:28.757Z",
          "ReturnUrl": "",
          "SignupReturnUrl": "",
          "SuggestedAccountType": "EASI",
          "SiteId": "",
          "VerificationCodeSlt": "",
          "WReply": "",
          "MemberNameChangeCount": 2,
          "MemberNameAvailableCount": 2,
          "MemberNameUnavailableCount": 0,
          "Password": "sonlian23424242",
          "uiflvr": 1001,
          "scid": 100118,
          "uaid": prepareData.uaid,
          "hpgid": 200225
        }
      });

      const errorData = JSON.parse(data.error.data);
  
      return {
        blob: encodeURIComponent(errorData.arkoseBlob),
        prepareData: prepareData,
        errorData: errorData
      };
    }
    catch(error) {
      throw new Error(`Generate blob error: ${error.message}`);
    }
  }

  const prepareData = await generatePrepareData();
  return generateBlob(prepareData);
}

module.exports = generateMSSignupBlob;