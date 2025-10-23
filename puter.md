Puter.js is actually meant for JS, but it uses an API, so it must be posible
i have already tinkered with it and got a simple Python script that gets a temp account and its token. It uses that token where needed and makes the API request.
https://docs.puter.com/
https://developer.puter.com
https://developer.puter.com/tutorials

Side note: this API is annoying to work with. And their system prompts seem to be set incorrectly.

Python script for OpenAI models(gpt-4o, gpt-4o-mini, o1, o1-mini, o1-pro, o3, o3-mini, o4-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, gpt-4.5-preview) (yeah, the rest I am not going to try). I already did formatting it from an OpenAI layout.

import requests
import json
import tempfile
import time
import sys

api_input = {
"model": "gpt-4o-mini",
"messages": [
{
"role": "user",
"content": "hi"
},
{
"role": "assistant",
"content": "Hello!"
},
{
"role": "user",
"content": "what was my first message?"
}
],
"stream": True
}

model = api_input["model"]
debug = True
stream = api_input.get("stream", False)

def create_request_body(api_input):
return {
"interface": "puter-chat-completion",
"driver": "openai-completion",
"test_mode": False,
"method": "complete",
"args": {
"messages": api_input["messages"],
"model": api_input["model"],
"stream": api_input.get("stream", False), # Use api_input to get stream value
}
}

def read_auth_token():
try:
with open('auth_token.json', 'r') as token_file:
data = json.load(token_file) # Check if the file is empty
if not data.get("auth", {}).get("tokens"):
return None

            # Find the first working token
            for token_entry in data["auth"]["tokens"]:
                if token_entry.get("working"):
                    return token_entry.get("token")
            return None  # Return None if no working token is found
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def set_auth_token_working(token, working):
try:
with open('auth_token.json', 'r') as token_file:
data = json.load(token_file)
except (FileNotFoundError, json.JSONDecodeError):
data = {"auth": {"tokens": []}}

    if "auth" not in data:
        data["auth"] = {"tokens": []}
    if "tokens" not in data["auth"]:
        data["auth"]["tokens"] = []

    token_found = False
    for token_entry in data["auth"]["tokens"]:
        if token_entry["token"] == token:
            token_entry["working"] = working
            token_found = True
            break  # Exit the loop if the token is updated

    if not token_found:
        data["auth"]["tokens"].append({"token": token, "working": working})

    # Save back to the file
    with open('auth_token.json', 'w') as token_file:
        json.dump(data, token_file, indent=2)

def signup_user():
url_signup = "https://puter.com/signup"
headers_signup = {
"Content-Type": "application/json",
"host": "api.puter.com",
"connection": "keep-alive",
"sec-ch-ua-platform": "macOS",
"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
"sec-ch-ua": '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
"sec-ch-ua-mobile": "?0",
"accept": "_/_",
"origin": "https://puter.com",
"sec-fetch-site": "same-site",
"sec-fetch-mode": "cors",
"sec-fetch-dest": "empty",
"referer": "https://puter.com/",
"accept-encoding": "gzip",
"accept-language": "en-US,en;q=0.9"
}
body_signup = {
"is_temp": True
}
response_signup = requests.post(url_signup, headers=headers_signup, json=body_signup)
if debug:
print(response_signup.status_code)
print(response_signup.headers)
print(response_signup.text)

    # Extracting the auth_token from the response_signup text
    auth_token = response_signup.json().get("token")
    print("Extracted auth token:", auth_token)

    # Save the auth token to a JSON file
    with open('auth_token.json', 'w') as token_file:
        set_auth_token_working(auth_token, True)

# Request to get a new user app token

def get_user_app_token(auth_token):
url38 = "https://api.puter.com/auth/get-user-app-token"
headers38 = {
"host": "api.puter.com",
"connection": "keep-alive",
"authorization": f"Bearer {auth_token}",
"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
"accept": "_/_",
"origin": "https://puter.com",
"sec-fetch-site": "same-site",
"sec-fetch-mode": "cors",
"sec-fetch-dest": "empty",
"referer": "https://puter.com/",
"accept-encoding": "gzip",
"accept-language": "en-US,en;q=0.9",
"content-type": "application/json"
}
body_auth = {
"origin": "http://localhost:5500"
}
response38 = requests.post(url38, headers=headers38, json=body_auth)
if debug:
print(response38.status_code)
print(response38.headers)
print(response38.text)

    # Extracting the new token from the response38 text
    new_token = response38.json().get("token")
    print("Extracted new token:", new_token)
    return new_token

# Request to call the driver

def call_driver(new_token, auth_token, request_body):
url_call = "https://api.puter.com/drivers/call"
headers_call = {
"host": "api.puter.com",
"connection": "keep-alive",
"authorization": f"Bearer {new_token}",
"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
"content-type": "application/json;charset=UTF-8",
"accept": "text/event-stream" if stream else "_/_",
"origin": "http://localhost:5500",
"sec-fetch-site": "cross-site",
"sec-fetch-mode": "cors",
"sec-fetch-dest": "empty",
"referer": "http://localhost:5500/",
"accept-encoding": "gzip",
"accept-language": "en-US,en;q=0.9"
}
body_call = request_body
response_call = requests.post(url_call, headers=headers_call, json=body_call, stream=stream)
if debug:
print(response_call.status_code)
print(response_call.headers)
print(response_call.text)

    if response_call.status_code == 400:
        response_json = response_call.json()
        if response_json.get("success") is False and response_json.get("error", {}).get("delegate") == "usage-limited-chat":
            set_auth_token_working(auth_token, False)
            return None

    if response_call.status_code == 200 and not stream:
        response_json = response_call.json()
        # Construct the output in the desired format
        output = {
            "id": "chatcmpl-B9MBs8CjcvOU2jLn4n570S5qMJKcT",  # Placeholder ID
            "object": "chat.completion",
            "created": int(time.time()),  # Actual created timestamp
            "model": model,  # Placeholder model
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_json.get("result", {}).get("message", {}).get("content"),
                        "refusal": None,
                        "annotations": []
                    },
                    "logprobs": None,
                    "finish_reason": response_json.get("result", {}).get("finish_reason")
                }
            ],
            "usage": {
                "prompt_tokens": sum(item['amount'] for item in response_json.get("result", {}).get("usage", []) if item['type'] == "prompt"),
                "completion_tokens": sum(item['amount'] for item in response_json.get("result", {}).get("usage", []) if item['type'] == "completion"),
                "total_tokens": sum(item['amount'] for item in response_json.get("result", {}).get("usage", [])),
                "prompt_tokens_details": {
                    "cached_tokens": 0,
                    "audio_tokens": 0
                },
                "completion_tokens_details": {
                    "reasoning_tokens": 0,
                    "audio_tokens": 0,
                    "accepted_prediction_tokens": 0,
                    "rejected_prediction_tokens": 0
                }
            },
            "service_tier": "default"  # Placeholder service tier
        }
        print (output)
        return output  # Return the constructed output

    elif response_call.status_code == 200 and stream:
        try:
            for line in response_call.iter_lines(decode_unicode=True):
                if line:
                    try:
                        data = json.loads(line)
                        if data.get("type") == "text":
                            # Construct the output in the desired format
                            output = {
                                "id": "chatcmpl-123",  # Placeholder ID
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),  # Actual created timestamp
                                "model": model,  # Placeholder model
                                "system_fingerprint": "fp_44709d6fcb",  # Placeholder fingerprint
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {
                                            "role": "assistant",
                                            "content": data.get("text", "")
                                        },
                                        "logprobs": None,
                                        "finish_reason": None
                                    }
                                ]
                            }
                            print(json.dumps(output))  # Print the output as a JSON string
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print("Error processing stream:", e)
            return None  # Return None in case of an error

def main():
auth_token = read_auth_token()
if not auth_token:
print("No auth token found. Signing up a new user...")
signup_user()
auth_token = read_auth_token()
elif auth_token:
print("Auth token found. Getting user app token...")

    new_token = get_user_app_token(auth_token)
    request_body = create_request_body(api_input)
    response = call_driver(new_token, auth_token, request_body)
    if response:
        print("response:", response)
    if not response:
        print("No answer received. Reading auth token again...")
        auth_token = read_auth_token()
        if not auth_token:
            print("The limit was possibly reached. Signing up a new user...")
            signup_user()
            auth_token = read_auth_token()
            if not auth_token:
                print("Failed to obtain auth token after signup.")
                return
        new_token = get_user_app_token(auth_token)
        response = call_driver(new_token, auth_token, request_body)
        print("new response:", response)

if **name** == "**main**":
main()
I did ask Gemini to make a script. The second reason is the last working one, I think.
https://g.co/gemini/share/7a09562c4408

Also, I have made a simple HTML to test the puter.js and get the API from it (use in private window so the temp account does not get saved). You have to host it to make it work (http.server for example).

<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Chat with AI Models</title>
  <!-- Include Puter.js from their CDN -->
  <script src="https://js.puter.com/v2/"></script>
  <style>
    body {
      font-family: sans-serif;
      background-color: #f0f0f0;
      padding: 20px;
    }
    #chat-container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      text-align: center;
    }
    #model-select {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      font-size: 16px;
    }
    #chat-box {
      display: flex;
      margin-bottom: 15px;
    }
    #chat-input {
      flex-grow: 1;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 4px 0 0 4px;
      outline: none;
    }
    #send-btn {
      padding: 10px 20px;
      font-size: 16px;
      border: 1px solid #007bff;
      background-color: #007bff;
      color: #fff;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      outline: none;
    }
    #chat-output {
      max-height: 300px;
      overflow-y: auto;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    .user, .ai {
      padding: 8px;
      margin: 5px 0;
      border-radius: 4px;
    }
    .user {
      background: #d1e7dd;
      text-align: right;
    }
    .ai {
      background: #f8d7da;
      text-align: left;
    }
  </style>
</head>
<body>
  <div id="chat-container">
    <h1>Chat with AI Model</h1>
    <!-- Dropdown to select the model -->
    <select id="model-select">
      <option value="gpt-4o">GPT-4o</option>
      <option value="gpt-4o-mini">GPT-4o-mini</option>
      <option value="o1">o1</option>
      <option value="o1-mini">o1-mini</option>
      <option value="o1-pro">o1-pro</option>
      <option value="o3">o3</option>
      <option value="o3-mini">o3-mini</option>
      <option value="o4-mini">o4-mini</option>
      <option value="gpt-4.1">GPT-4.1</option>
      <option value="gpt-4.1-mini">GPT-4.1-mini</option>
      <option value="gpt-4.1-nano">GPT-4.1-nano</option>
      <option value="gpt-4.5-preview">GPT-4.5-preview</option>
    </select>
    
    <!-- Chat input area -->
    <div id="chat-box">
      <input type="text" id="chat-input" placeholder="Type your message here..." />
      <button id="send-btn">Send</button>
    </div>
    
    <!-- Chat output container -->
    <div id="chat-output"></div>
  </div>

  <script>
    // Get DOM elements
    const modelSelect = document.getElementById("model-select");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const chatOutput = document.getElementById("chat-output");

    // Function to append messages to the chat window.
    function appendMessage(content, sender = 'ai') {
      const messageElement = document.createElement("div");
      messageElement.classList.add(sender);
      messageElement.innerHTML = content;
      chatOutput.appendChild(messageElement);
      chatOutput.scrollTop = chatOutput.scrollHeight; // Ensure the latest message is visible.
    }

    // Send button click event handler
    sendBtn.addEventListener("click", async () => {
      const userMessage = chatInput.value.trim();
      if (!userMessage) return;

      // Append the user's message
      appendMessage("<strong>You:</strong> " + userMessage, "user");

      // Get the model the user selected
      const selectedModel = modelSelect.value;

      // Clear the input
      chatInput.value = '';

      try {
        // Make the API call with the selected model
        const response = await puter.ai.chat(userMessage, { model: selectedModel }, testMode=false);
        appendMessage("<strong>" + selectedModel + ":</strong> " + response, "ai");
      } catch (error) {
        appendMessage("<strong>Error:</strong> " + error.message, "ai");
      }
    });

    // Allow sending the message using the Enter key
    chatInput.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        sendBtn.click();
      }
    });
  </script>
</body>
</html>
