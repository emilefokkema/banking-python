# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START gae_python37_render_template]
from flask import Flask, request
from google.auth.transport import requests
from google.cloud import datastore
import google.oauth2.id_token
from src.datastoredataprovider import DataStoreDataProvider
from src.decorators import wraps
from src.registerroutes import registerRoutes

datastore_client = datastore.Client()
firebase_request_adapter = requests.Request()

@wraps
def accessesData(f):
    def wrap():
        claims = None
        error_message = None
        # Verify Firebase auth.
        id_token = request.cookies.get("token")
        if not id_token:
            error_message = 'no token was present in the cookie'
        else:
            try:
                # Verify the token against the Firebase Auth API. This example
                # verifies the token on each page load. For improved performance,
                # some applications may wish to cache results in an encrypted
                # session store (see for instance
                # http://flask.pocoo.org/docs/1.0/quickstart/#sessions).
                claims = google.oauth2.id_token.verify_firebase_token(
                    id_token, firebase_request_adapter)
            except ValueError as exc:
                # This will be raised if the token is expired or any other
                # verification checks fail.
                error_message = str(exc)

        if error_message:
            return error_message, 500
        dataprovider = DataStoreDataProvider(datastore_client, claims['email'])
        return f(dataprovider)
    return wrap

app = Flask(__name__)

registerRoutes(app, accessesData)

if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host='127.0.0.1', port=8080, debug=True)
# [START gae_python37_render_template]
