from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
DATA_FILE = 'skeduel-data.json'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/data', methods=['GET'])
def get_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return jsonify(json.load(f))
    return jsonify({})


@app.route('/api/data', methods=['POST'])
def save_data():
    with open(DATA_FILE, 'w') as f:
        json.dump(request.json, f)
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True)