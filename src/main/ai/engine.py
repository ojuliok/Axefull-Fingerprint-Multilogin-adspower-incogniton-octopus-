import sys
import json
import logging
import traceback
from datetime import datetime

# Setup simple file logging for debugging
logging.basicConfig(filename='ai_engine.log', level=logging.INFO)

def calculate_score(features):
    """
    Very basic heuristic function acting as a placeholder for a real ML model.
    Real ML would load a .pkl model here.
    """
    cookie_count = features.get('cookieCount', 0)
    history_size = features.get('historySize', 0)
    profile_size = features.get('profileSizeMb', 0)
    
    score = 10 # Base score
    
    # Cookies are highly valued
    if cookie_count > 50:
        score += 30
    elif cookie_count > 10:
        score += 15
        
    # History adds trust
    if history_size > 500:
        score += 25
    elif history_size > 100:
        score += 10
        
    # Profile size (cache, local storage)
    if profile_size > 50:
        score += 35
    elif profile_size > 20:
        score += 15
        
    return min(100, max(0, score))

def process_message(line):
    try:
        msg = json.loads(line)
        req_id = msg.get('id')
        method = msg.get('method')
        params = msg.get('params', {})
        
        if method == 'predict_score':
            features = params.get('features', {})
            score = calculate_score(features)
            
            response = {
                'jsonrpc': '2.0',
                'id': req_id,
                'result': {
                    'score': score,
                    'confidence': 0.85,
                    'status': 'good' if score > 70 else 'needs_warmup'
                }
            }
            sys.stdout.write(json.dumps(response) + '\n')
            sys.stdout.flush()
            
        elif method == 'train':
            # Stub for reinforcement learning
            response = {
                'jsonrpc': '2.0',
                'id': req_id,
                'result': { 'status': 'model_updated' }
            }
            sys.stdout.write(json.dumps(response) + '\n')
            sys.stdout.flush()
            
        elif method == 'ping':
            sys.stdout.write(json.dumps({'jsonrpc': '2.0', 'id': req_id, 'result': 'pong'}) + '\n')
            sys.stdout.flush()
            
    except Exception as e:
        logging.error(f"Error processing message: {traceback.format_exc()}")
        err_msg = {
            'jsonrpc': '2.0',
            'error': {'code': -32603, 'message': str(e)}
        }
        sys.stdout.write(json.dumps(err_msg) + '\n')
        sys.stdout.flush()

if __name__ == '__main__':
    logging.info(f"AI Engine Started at {datetime.now()}")
    for line in sys.stdin:
        if not line.strip():
            continue
        process_message(line)
