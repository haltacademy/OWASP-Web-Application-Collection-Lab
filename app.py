import os
import subprocess
import yaml
from flask import Flask, jsonify, request, render_template, session, redirect, url_for
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)

COMPOSE_FILE = 'docker-compose.yml'

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def api_login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_labs():
    labs = []
    if not os.path.exists(COMPOSE_FILE):
        return labs
        
    with open(COMPOSE_FILE, 'r') as f:
        compose_data = yaml.safe_load(f)
        
    services = compose_data.get('services', {})
    
    # Get current status of all compose services
    try:
        running_services = []
        try:
            status_res = subprocess.run(['docker', 'compose', 'ps', '--services', '--status', 'running'], capture_output=True, text=True)
            running_services = status_res.stdout.splitlines()
        except Exception as e:
            print(f"Error getting running services: {e}")
            pass
            
        for service_name, service_info in services.items():
            labels = service_info.get('labels', [])
            lab_data = {
                'id': service_name,
                'name': service_name,
                'description': 'No description available',
                'port': None,
                'status': 'running' if service_name in running_services else 'stopped'
            }
            
            if isinstance(labels, list):
                for label in labels:
                    if label.startswith('lab.name='):
                        lab_data['name'] = label.split('=', 1)[1]
                    elif label.startswith('lab.description='):
                        lab_data['description'] = label.split('=', 1)[1]
                    elif label.startswith('lab.port='):
                        lab_data['port'] = label.split('=', 1)[1]
            elif isinstance(labels, dict):
                lab_data['name'] = labels.get('lab.name', lab_data['name'])
                lab_data['description'] = labels.get('lab.description', lab_data['description'])
                lab_data['port'] = labels.get('lab.port', lab_data['port'])
                
            labs.append(lab_data)
    except Exception as e:
        print(f"Error: {e}")
        
    return labs

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form.get('username') == 'owasp' and request.form.get('password') == 'owasp':
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            error = 'Invalid credentials. Please try again.'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/api/labs', methods=['GET'])
@api_login_required
def list_labs():
    return jsonify(get_labs())

@app.route('/api/labs/<lab_id>/start', methods=['POST'])
@api_login_required
def start_lab(lab_id):
    try:
        # Run asynchronously so we don't block the UI while pulling heavy images
        subprocess.Popen(['docker', 'compose', 'up', '-d', lab_id])
        return jsonify({'status': 'success', 'message': f'{lab_id} is starting in the background'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/labs/<lab_id>/stop', methods=['POST'])
@api_login_required
def stop_lab(lab_id):
    try:
        subprocess.run(['docker', 'compose', 'stop', lab_id], check=True, capture_output=True)
        return jsonify({'status': 'success', 'message': f'{lab_id} stopped successfully'})
    except subprocess.CalledProcessError as e:
        return jsonify({'status': 'error', 'message': str(e.stderr)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
