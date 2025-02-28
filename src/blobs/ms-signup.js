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
          "RequestTimeStamp": new Date().toISOString(),
          "MemberName": "mrccaptcha12436@hotmail.com",
          "CheckAvailStateMap": [
            "mrccaptcha12436@hotmail.com:undefined"
          ],
          "EvictionWarningShown": [],
          "UpgradeFlowToken": {},
          "FirstName": "lian",
          "LastName": "son",
          "MemberNameChangeCount": 1,
          "MemberNameAvailableCount": 1,
          "MemberNameUnavailableCount": 0,
          "CipherValue": "apH/r5NbNAnfRHRiVmtqBYTwRLzVwoVBmH87U09TnXMTktgFw3KYxCKyuq7TmyDVxDatGHYyx6IkILIOjygoddiuw487hn0R/id9BeMh3ljc9VF/qyvQ9yNd23dNNtAhan6mPBGo0TxB7/xU6Hw5Rw0GVFUJDr89Z5+YAesrJKcwyyQICu9OUsA2yj2KoT/K6adJ6BICSmYKGPPIIMjPptB0naLbTNp8a41fHjsHk6LvUAQx+94Lpk3N3/ZIgEQPnhhMhdDF6Uzp1h+JLQjkVgM/dMFej5Wo8Mkiv2cEIgthF4s8L5CL4FChKz2nHcThtmpvYNSaLs3c4JgtHeFvIA==",
          "SKI": "25CE4D96CB3A09A69CD847C69FC6D40AF4A4DE12",
          "BirthDate": "02:04:1999",
          "Country": "US",
          "IsOptOutEmailDefault": true,
          "IsOptOutEmailShown": true,
          "IsOptOutEmail": true,
          "LW": true,
          "SiteId": "68692",
          "IsRDM": 0,
          "WReply": null,
          "ReturnUrl": null,
          "SignupReturnUrl": null,
          "uiflvr": 1001,
          "uaid": prepareData.uaid,
          "SuggestedAccountType": "EASI",
          "HFId": "c43535691d074d768968c727fba1f1b3",
          "encAttemptToken": "",
          "dfpRequestId": "",
          "PhoneRepRiskScoreDetails": "",
          "RiskAssessmentDetails": "",
          "RepMapRequestIdentifierDetails": "",
          "scid": 100118,
          "hpgid": 200639
        }
      });

      const errorData = JSON.parse(data.error.data);
  
      return encodeURIComponent(errorData.arkoseBlob);
    }
    catch(error) {
      throw new Error(`Generate blob error: ${error.message}`);
    }
  }

  const prepareData = await generatePrepareData();
  return generateBlob(prepareData);
}

module.exports = generateMSSignupBlob;