from flask import Flask
from src.decorators import wraps
import argparse
from src.dataprovider import DataProvider
from src.registerroutes import registerRoutes

@wraps
def accessesData(f):
	def wrap(*args, **kwargs):
		return f(DataProvider(), *args, **kwargs)
	return wrap

app = Flask(__name__)

parser = argparse.ArgumentParser()
parser.add_argument("--mocklogin", action="store_true")
parser.add_argument("--port", type=int, default=8080)
parser.add_argument("--host", type=str, default='127.0.0.1')
args = parser.parse_args()

registerRoutes(app, accessesData, mocklogin=args.mocklogin, debug=True)

if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    app.run(host=args.host, port=args.port, debug=True)