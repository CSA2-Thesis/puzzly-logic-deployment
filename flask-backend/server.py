import logging
import random
import time
import traceback
import os
from flask import Flask, make_response, request, jsonify
from flask_cors import CORS
from dictionary_helper import DictionaryHelper
from generate_downloadables import generate_png_image, generate_pdf
from generator.crossword_generator import CrosswordGenerator

from solver.algorithms.astar_solver import AStarSolver
from solver.algorithms.dfs_solver import DFSSolver
from solver.algorithms.hybrid_solver import HybridSolver
from solver.analysis.visualizer import ComplexityVisualizer

logging.basicConfig(
    level=logging.INFO if os.environ.get('RENDER') else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

if os.environ.get('RENDER'):
    frontend_url = os.environ.get('FRONTEND_URL', 'https://puzzlylogic.app')
    CORS(app, origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:3000"
    ])
    logger.info(f"CORS configured for production. Allowed origins: {frontend_url}, localhost")
else:
    CORS(app)
    logger.info("CORS configured for development (allowing all origins)")

try:
    dict_helper = DictionaryHelper("dictionary")
    logger.info("Dictionary helper initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize dictionary helper: {str(e)}")
    raise

complexity_trackers = {}

def _build_cors_preflight_response():
    """Build CORS preflight response"""
    response = jsonify({"message": "Preflight Request Accepted"})
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
    response.headers.add("Access-Control-Max-Age", "86400")  # 24 hours
    return response

def _corsify_actual_response(response, status_code=None):
    """Add CORS headers to actual responses"""
    if status_code:
        response.status_code = status_code
    return response

@app.before_request
def log_request_info():
    """Log request details for debugging"""
    if os.environ.get('RENDER'):
        logger.debug(f"Request: {request.method} {request.path}")
    else:
        logger.info(f"Request: {request.method} {request.path} - Headers: {dict(request.headers)}")

@app.after_request
def log_response_info(response):
    """Log response details for debugging"""
    if not os.environ.get('RENDER'):
        logger.info(f"Response: {response.status_code} - Size: {response.content_length} bytes")
    return response

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Render"""
    return jsonify({
        "status": "healthy",
        "service": "crossword-backend",
        "timestamp": time.time(),
        "environment": "production" if os.environ.get('RENDER') else "development"
    })

@app.route("/", methods=["GET"])
def home():
    """Root endpoint"""
    return jsonify({
        "message": "Crossword Puzzle Generator & Solver API",
        "version": "1.0.0",
        "endpoints": [
            "/health - Health check",
            "/generate - Generate crossword puzzle",
            "/solve - Solve crossword puzzle",
            "/analyze - Compare algorithms",
            "/suggest - Get word suggestions",
            "/download - Download puzzle"
        ]
    })

@app.route("/solve", methods=["POST", "OPTIONS"])
def solve():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        grid = data.get("grid")
        clues = data.get("clues")
        algorithm = data.get("algorithm", "HYBRID").upper()
        enable_memory_profiling = data.get("enable_memory_profiling", False)

        logger.info(f"Solve request - Algorithm: {algorithm}, Grid size: {len(grid)}x{len(grid[0]) if grid else 0}")

        if not grid or not clues:
            return jsonify({"error": "Missing grid or clues"}), 400

        start_time = time.time()

        if algorithm == "DFS":
            solver = DFSSolver(grid, clues, dict_helper, enable_memory_profiling)
        elif algorithm == "A*":
            solver = AStarSolver(grid, clues, dict_helper, enable_memory_profiling)
        elif algorithm == "HYBRID":
            solver = HybridSolver(grid, clues, dict_helper, enable_memory_profiling)
        else:
            return jsonify({"error": "Invalid algorithm"}), 400

        complexity_trackers[algorithm] = solver.complexity_tracker
        
        result = solver.solve()
        execution_time = time.time() - start_time

        memory_metrics = {
            "memory_usage_kb": result.get("memory_usage_kb", 0),
            "min_memory_kb": result.get("min_memory_kb", 0),
            "peak_memory_kb": result.get("peak_memory_kb", 0),
            "memory_profiling_enabled": enable_memory_profiling
        }

        response_data = {
            "method": algorithm,
            "success": result.get("status", "").lower() == "success",
            "solution": result.get("grid", []), 
            "metrics": {
                "execution_time": f"{execution_time:.4f}s",
                **memory_metrics,
                "words_placed": f"{result.get('words_placed', 0)}/{result.get('total_words', 0)}",
                "time_complexity": result.get("time_complexity", {}),
                "space_complexity": result.get("space_complexity", {}),
                "fallback_usage_count": result.get("fallback_usage_count", 0),
            },
            "details": {
                "status": result.get("status", "unknown"),
                "algorithm": algorithm
            }
        }

        logger.info(f"Solve completed - Algorithm: {algorithm}, Success: {response_data['success']}, Time: {execution_time:.4f}s")
        return _corsify_actual_response(jsonify(response_data))

    except Exception as e:
        logger.error(f"Solve error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500)

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze_complexity():
    """Run all algorithms and compare their complexity"""
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data received"}), 400

        grid = data.get("grid")
        clues = data.get("clues")

        if not grid or not clues:
            return jsonify({"error": "Missing grid or clues"}), 400

        logger.info(f"Analysis request - Grid size: {len(grid)}x{len(grid[0])}")

        algorithms = {
            "DFS": DFSSolver(grid, clues, dict_helper),
            "A*": AStarSolver(grid, clues, dict_helper),
            "HYBRID": HybridSolver(grid, clues, dict_helper)
        }
        
        results = {}
        for algo_name, solver in algorithms.items():
            logger.info(f"Running {algo_name} solver...")
            start_time = time.time()
            result = solver.solve()
            execution_time = time.time() - start_time
            
            complexity_trackers[algo_name] = solver.complexity_tracker
            
            results[algo_name] = {
                "success": result.get("status", "").lower() == "success",
                "solution": result.get("grid", []),
                "metrics": {
                    "execution_time": f"{execution_time:.4f}s",
                    "memory_usage_kb": result.get("memory_usage_kb", 0),
                    "words_placed": f"{result.get('words_placed', 0)}/{result.get('total_words', 0)}",
                    "time_complexity": result.get("time_complexity", {}),
                    "space_complexity": result.get("space_complexity", {})
                },
                "details": {
                    "status": result.get("status", "unknown")
                }
            }
            logger.info(f"{algo_name} completed - Success: {results[algo_name]['success']}, Time: {execution_time:.4f}s")

        return _corsify_actual_response(jsonify(results))

    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500)

@app.route("/visualize", methods=["GET", "OPTIONS"])
def visualize_complexity():
    """Generate complexity visualization for the last run algorithms"""
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
        
    try:
        algorithm = request.args.get("algorithm", "").upper()
        chart_type = request.args.get("type", "combined")
        
        logger.info(f"Visualization request - Algorithm: {algorithm}, Type: {chart_type}")

        if algorithm and algorithm in complexity_trackers:
            trackers = {algorithm: complexity_trackers[algorithm]}
            title = f"{algorithm} Algorithm Complexity"
        else:
            trackers = complexity_trackers
            title = "Algorithm Complexity Comparison"
        
        if not trackers:
            return jsonify({"error": "No complexity data available. Run solvers first."}), 400
            
        if chart_type == "time":
            ComplexityVisualizer.plot_time_complexity(trackers, title)
        elif chart_type == "space":
            ComplexityVisualizer.plot_space_complexity(trackers, title)
        else:
            ComplexityVisualizer.plot_combined_complexity(trackers, title)
            
        logger.info(f"Visualization generated for {len(trackers)} algorithm(s)")
        return _corsify_actual_response(jsonify({
            "success": True,
            "message": f"Complexity visualization generated for {len(trackers)} algorithm(s)"
        }))
        
    except Exception as e:
        logger.error(f"Visualization error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({
            "error": "Failed to generate visualization",
            "details": str(e)
        }), 500)

@app.route("/suggest", methods=["GET", "OPTIONS"])
def suggest_words():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
        
    try:
        clue = request.args.get("clue", "")
        max_words = int(request.args.get("max", 20))
        
        logger.info(f"Word suggestion request - Clue: {clue}, Max words: {max_words}")
        
        words = dict_helper.get_possible_words(clue=clue, max_words=max_words)
        
        logger.info(f"Returning {len(words)} word suggestions")
        return _corsify_actual_response(jsonify(words))
        
    except Exception as e:
        logger.error(f"Suggestion error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({
            "error": "Failed to get word suggestions",
            "details": str(e)
        }), 500)

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
        
    try:
        data = request.get_json()
        size = int(data.get('size', 15))
        difficulty = data.get('difficulty', 'medium')

        logger.info(f"Generation request - Size: {size}, Difficulty: {difficulty}")

        if size < 7 or size > 21:
            return jsonify({
                "success": False,
                "error": "Size must be between 7 and 21"
            }), 400

        if difficulty not in ['easy', 'medium', 'hard']:
            return jsonify({
                "success": False,
                "error": "Difficulty must be easy, medium, or hard"
            }), 400

        DENSITY_BOUNDS = {
            'easy': (0.35, 0.50),
            'medium': (0.60, 0.69),
            'hard': (0.80, 1.00)
        }
        min_density, max_density = DENSITY_BOUNDS[difficulty]

        if difficulty == 'easy':
            min_word_length = max(3, size//3)
            max_word_length = min(12, size)
            max_attempts = 3
            word_count_multiplier = 0.7
        elif difficulty == 'hard':
            min_word_length = 3
            max_word_length = size
            max_attempts = 5
            word_count_multiplier = 1.3
        else:
            min_word_length = max(3, size//4)
            max_word_length = min(10, size)
            max_attempts = 4
            word_count_multiplier = 1.0

        base_word_count = size * 1.5
        target_word_count = int(base_word_count * word_count_multiplier)

        initial_length = random.randint(min_word_length, min(max_word_length, size//2))
        possible_words = dict_helper.get_words_by_length(length=initial_length, max_words=100)
        if not possible_words:
            return jsonify({
                "success": False,
                "error": "No suitable initial words found",
                "message": "Try a smaller grid size or different difficulty"
            }), 400

        MAX_GENERATION_TRIES = 15
        generated_puzzle = None
        best_puzzle = None
        best_density = 0.0

        for attempt in range(MAX_GENERATION_TRIES):
            logger.info(f"Generation attempt {attempt + 1}/{MAX_GENERATION_TRIES} [diff={difficulty}]")

            word_list = []
            dynamic_max_len = max_word_length + (attempt % 2)
            for length in range(min_word_length, dynamic_max_len + 1):
                words = dict_helper.get_words_by_length(
                    length=length,
                    max_words=int(target_word_count / 2) + random.randint(0, 20)
                )
                word_list.extend(words)
            random.shuffle(word_list)

            initial_word = random.choice(possible_words)['word']

            generator = CrosswordGenerator(size, size)
            puzzle = generator.generate(
                initial_word=initial_word,
                word_list=word_list,
                max_attempts=max_attempts
            )

            if not puzzle:
                continue

            density = puzzle.calculate_density()

            if density > best_density:
                best_density = density
                best_puzzle = puzzle

            if min_density <= density <= max_density:
                generated_puzzle = puzzle
                break

        final_puzzle = generated_puzzle or best_puzzle

        if not final_puzzle:
            return jsonify({
                "success": False,
                "error": "Failed to generate any valid puzzle",
                "message": "Please try again with different settings."
            }), 400

        final_density = final_puzzle.calculate_density()
        used_fallback = generated_puzzle is None

        if used_fallback:
            logger.warning(f"Used fallback puzzle with density={final_density:.2%} "
                          f"(target: {min_density:.2%}-{max_density:.2%})")

        empty_grid = final_puzzle.empty_grid
        
        across, down = final_puzzle.analyze_grid(for_empty_grid=True)
        numbered_positions = {(slot.x, slot.y): slot.number for slot in across + down}
        
        for y in range(final_puzzle.height):
            for x in range(final_puzzle.width):
                if (x, y) in numbered_positions:
                    empty_grid[y][x] = str(numbered_positions[(x, y)])
        
        response_data = {
            "success": True,
            "grid": final_puzzle.grid,
            "empty_grid": empty_grid,   
            "clues": final_puzzle.get_clues(),
            "stats": {
                "word_count": len(final_puzzle.words),
                "difficulty": difficulty,
                "size": size,
                "density": final_puzzle.calculate_density(),
                "used_fallback": used_fallback
            }
        }

        logger.info(f"Generation successful - Word count: {len(final_puzzle.words)}, Density: {final_density:.2%}")
        return _corsify_actual_response(jsonify(response_data))

    except Exception as e:
        logger.error(f"Generation error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e)
        }), 500)

@app.route('/download', methods=['POST', 'OPTIONS'])
def download():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
        
    try:
        data = request.get_json()
        puzzle = data.get('puzzle')
        format = data.get('format', 'png').lower()
        show_answers = data.get('showAnswers', False)
        
        logger.info(f"Download request - Format: {format}, Show answers: {show_answers}")

        if not puzzle:
            return _corsify_actual_response(jsonify({'error': 'No puzzle data provided'}), 400)
        
        if format == 'png':
            image_data = generate_png_image(puzzle, show_answers)
            response = make_response(image_data)
            response.headers['Content-Type'] = 'image/png'
            response.headers['Content-Disposition'] = 'attachment; filename=crossword.png'
            return _corsify_actual_response(response)
            
        elif format == 'pdf':
            pdf_data = generate_pdf(puzzle, show_answers)
            response = make_response(pdf_data)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = 'attachment; filename=crossword.pdf'
            return _corsify_actual_response(response)
            
        return _corsify_actual_response(jsonify({'error': 'Invalid format. Use "png" or "pdf".'}), 400)
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}", exc_info=True)
        return _corsify_actual_response(jsonify({'error': str(e)}), 500)

@app.errorhandler(404)
def not_found(error):
    return _corsify_actual_response(jsonify({
        "error": "Endpoint not found",
        "message": "The requested endpoint does not exist."
    }), 404)

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return _corsify_actual_response(jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred."
    }), 500)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    
    debug = not os.environ.get('RENDER')
    
    logger.info(f"Starting server on port {port} (debug: {debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)