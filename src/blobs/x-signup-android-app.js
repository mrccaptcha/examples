const SUBTASK_VERSIONS = {
  "generic_urt": 3,
  "standard": 1,
  "open_home_timeline": 1,
  "app_locale_update": 1,
  "enter_date": 1,
  "email_verification": 3,
  "deregister_device": 1,
  "enter_password": 5,
  "enter_text": 6,
  "one_tap": 2,
  "cta": 7,
  "single_sign_on": 1,
  "fetch_persisted_data": 1,
  "enter_username": 3,
  "web_modal": 2,
  "fetch_temporary_password": 1,
  "menu_dialog": 1,
  "sign_up_review": 5,
  "user_recommendations_urt": 3,
  "in_app_notification": 1,
  "sign_up": 2,
  "typeahead_search": 1,
  "app_attestation": 1,
  "user_recommendations_list": 4,
  "cta_inline": 1,
  "contacts_live_sync_permission_prompt": 3,
  "choice_selection": 5,
  "js_instrumentation": 1,
  "alert_dialog_suppress_client_events": 1,
  "privacy_options": 1,
  "topics_selector": 1,
  "wait_spinner": 3,
  "tweet_selection_urt": 1,
  "end_flow": 1,
  "settings_list": 7,
  "open_external_link": 1,
  "phone_verification": 5,
  "security_key": 3,
  "select_banner": 2,
  "upload_media": 1,
  "web": 2,
  "alert_dialog": 1,
  "open_account": 2,
  "passkey": 1,
  "action_list": 2,
  "enter_phone": 2,
  "open_link": 1,
  "show_code": 1,
  "update_users": 1,
  "check_logged_in_account": 1,
  "enter_email": 2,
  "select_avatar": 4,
  "location_permission_prompt": 2,
  "notifications_permission_prompt": 4
};

async function generateXSignupAndroidAppBlob(client) {
  let flowToken = '';
  let tasks = [];
  let nextTask = '';
  let datablob = '';
  
  const generateGuestToken = async () => {
    try {
      const {data} = await client({
        url: 'https://api.twitter.com/1.1/guest/activate.json',
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
        },
      });
      
      return data.guest_token;
    }
    catch(error) {
      throw new Error(`Generate guest token error: ${error.message}`);
    }
  }

  function handleXOnboardingResponse(data) {
    flowToken = data.flow_token;
    tasks.push(...data.subtasks);
    nextTask = data.subtasks?.[0]?.subtask_id || '';

    // const langs = data?.subtasks?.[0]?.choice_selection;

    // if (langs) {
    //   console.log(JSON.stringify(langs));
    //   throw new Error('Test');
    // }

    const arkoseTask = data.subtasks.find(task => task.subtask_id.includes('ArkoseEmail'));

    if (arkoseTask) {
      if (!arkoseTask?.web_modal?.url) {
        throw new Error('Find ArkoseEmail error');
      }

      const blob = new URL(arkoseTask.web_modal.url).searchParams.get('data');

      if (!blob) {
        throw new Error('Does not have blob data');
      }

      datablob = blob;
    }
  }

  async function doFlowTaskSignup(opts) {
    try {
      const response = await client({
        method: 'POST',
        url: `https://api.twitter.com/1.1/onboarding/task.json`,
        params: opts.params || undefined,
        headers: { 
          'Content-Type': 'application/json'
        },
        data: {
          ...opts.data,
          "subtask_versions": SUBTASK_VERSIONS
        }
      });

      if (response.status != 200) {
        throw new Error(`\n\nOpts: ${JSON.stringify(opts)}\n=============================\nResponse: ${JSON.stringify(response.data)}`);
      }

      handleXOnboardingResponse(response.data);
    }
    catch(error) {
      throw new Error(`Do flow task signup error: ${error.message}`);
    }
  }

  async function doFlowTaskSignupStart() {
    return doFlowTaskSignup({
      params: {
        'flow_name': 'signup',
        'api_version': '1',
        'known_device_token': '',
        'sim_country_code': 'vi'
      },
      data: {
        "input_flow_data": {
          "country_code": null,
          "flow_context": {
            "referrer_context": {
              "referral_details": "utm_source=google-play&utm_medium=organic",
              "referrer_url": ""
            },
            "start_location": {
              "location": "splash_screen"
            }
          },
          "requested_variant": null,
          "target_user_id": 0
        },
      }
    });
  }

  async function doFlowTaskLanguageMultiSelect() {
    return doFlowTaskSignup({
      data: {
        "flow_token": flowToken,
        "subtask_inputs": [
          {
            "choice_selection": {
              "primary_choice": "vi",
              "selected_choices": [
                "vi"
              ],
              "link": "next_link"
            },
            "subtask_id": "LanguageMultiSelectorSubtask"
          }
        ],
      }
    });
  }

  async function doFlowTaskSignupAttestation() {
    return doFlowTaskSignup({
      data: {
        "flow_token": flowToken,
        "subtask_inputs": [
          {
            "app_attestation": {
              "link": "next_link"
            },
            "subtask_id": "Attestation"
          }
        ],
      }
    });
  }

  async function doFlowTaskLanguageAppLocaleUpdate() {
    return doFlowTaskSignup({
      data: {
        "flow_token": flowToken,
        "subtask_inputs": [{
          "app_locale_update": {
            "link": "next_link"
          },
          "subtask_id": "LanguageAppLocaleUpdateSubtask"
        }],
      }
    });
  }

  const guestToken = await generateGuestToken();

  client.defaults.headers['X-Guest-Token'] = guestToken;

  await doFlowTaskSignupStart();

  while(!datablob && nextTask) {
    if (nextTask == 'LanguageMultiSelectorSubtask') {
      await doFlowTaskLanguageMultiSelect();
      continue;
    }

    if (nextTask == 'Attestation') {
      await doFlowTaskSignupAttestation();
      continue;
    }

    if (nextTask == 'LanguageAppLocaleUpdateSubtask') {
      await doFlowTaskLanguageAppLocaleUpdate();
      continue;
    }

    throw new Error(`New task not yet defined: ${nextTask}`);
  }

  return datablob;
}

module.exports = generateXSignupAndroidAppBlob;