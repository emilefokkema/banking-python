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
import datetime
from flask import Flask, render_template, request
from google.auth.transport import requests
from google.cloud import datastore
import google.oauth2.id_token
from src.defaultsettingsprovider import DefaultSettingsProvider
from src.datastoredataprovider import DataStoreDataProvider
import traceback
import json

datastore_client = datastore.Client()
firebase_request_adapter = requests.Request()

def store_time(email, dt):
    entity = datastore.Entity(key=datastore_client.key('User', email, 'visit'))
    entity.update({
        'timestamp': dt
    })

    datastore_client.put(entity)


def fetch_times(email, limit):
    ancestor = datastore_client.key('User', email)
    query = datastore_client.query(kind='visit', ancestor=ancestor)
    query.order = ['-timestamp']

    times = query.fetch(limit=limit)

    return times

def wraps(wrapper):
    def newWrapper(f):
        wrap = wrapper(f)
        wrap.__name__ = f.__name__
        return wrap
    return newWrapper

@wraps
def returnsJson(f):
    def wrap(*args, **kwargs):
        result = f(*args, **kwargs)
        rest = []
        tupleReturned = isinstance(result, tuple)
        if tupleReturned:
            (result, *rest) = result
        result = json.dumps(result)
        if tupleReturned:
            return tuple([result] + rest)
        else:
            return result
    return wrap

@wraps
def catchesException(f):
    def wrap(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as exc:
            traceback.print_exc()
            return str(exc), 500
    return wrap

@wraps
def loggedIn(f):
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
                #store_time(claims['email'], datetime.datetime.now())
                #times = fetch_times(claims['email'], 10)
            except ValueError as exc:
                # This will be raised if the token is expired or any other
                # verification checks fail.
                error_message = str(exc)

        if error_message:
            return error_message, 500

        return f(claims)
    return wrap

app = Flask(__name__)


@app.route('/')
def root():

    return render_template(
        'index.html')

@app.route('/api/settings', methods=['POST','GET'])
@returnsJson
@catchesException
@loggedIn
def do_settings(claims):
    if request.method == 'POST':
        print(request.data)
        return 'OK'
    if request.method == 'GET':
        dataprovider = DataStoreDataProvider(datastore_client, claims['email'])
        return dataprovider.getItem('settings')

@app.route('/api/settings/default')
@returnsJson
def get_default_settings():
    return DefaultSettingsProvider().getDefaultSettings()


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
