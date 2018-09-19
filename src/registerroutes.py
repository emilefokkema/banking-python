from flask import render_template, request
import json
from src.decorators import returnsJson, catchesException
from src.defaultsettingsprovider import DefaultSettingsProvider
from src.periodhistory import PeriodHistory
from src.rowcheckerfactory import RowCheckerFactory
from src.rowcollection import RowCollectionFactory
from src.rowfactory import RowFactory
from src.csvprocessor import CsvProcessor

def registerRoutes(app, accessesData, mocklogin=False):

	@app.route('/')
	def root():

	    return render_template('index.html', mocklogin=mocklogin)

	@app.route('/api/settings', methods=['POST','GET'])
	@returnsJson
	@catchesException
	@accessesData
	def do_settings(dataprovider):
	    if request.method == 'POST':
	        settings = json.loads(request.data.decode('utf-8'))
	        dataprovider.setItem('settings', settings)
	        return 'OK'
	    if request.method == 'GET':
	        return dataprovider.getItem('settings')

	@app.route('/api/settings/default')
	@returnsJson
	def get_default_settings():
	    return DefaultSettingsProvider().getDefaultSettings()

	@app.route('/api/complete')
	@returnsJson
	@catchesException
	@accessesData
	def get_history(dataprovider):
	    history = PeriodHistory(dataprovider)
	    return history.getAll()

	@app.route('/api/csv', methods=['POST'])
	@returnsJson
	@catchesException
	@accessesData
	def post_csv(dataprovider):
	    history = PeriodHistory(dataprovider)
	    settings = dataprovider.getItem('settings')
	    if not settings:
	        return 'please provide settings before processing a csv', 500
	    rowDefinition = settings['rowDefinition']
	    rowFactory = RowFactory(rowDefinition)
	    rowCollectionFactory = RowCollectionFactory(rowFactory)
	    rowCheckerFactory = RowCheckerFactory(rowFactory)
	    categoriesConfiguration = settings['categories']
	    ignoreFirst = settings['ignoreFirstLine'] if 'ignoreFirstLine' in settings else False
	    processor = CsvProcessor(rowFactory, rowCheckerFactory, rowCollectionFactory, categoriesConfiguration, history, ignoreFirst)
	    return processor.processCsv(request.data.decode('utf-8').splitlines())

	@app.route('/api/delete', methods=['POST'])
	@returnsJson
	@catchesException
	@accessesData
	def delete_period(dataprovider):
	    history = PeriodHistory(dataprovider)
	    history.removeItem(request.data.decode('utf-8'))
	    return 'OK'