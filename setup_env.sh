#!/usr/bin/env zsh
# =============================================================
#  FinSense — One-command environment setup
#  Run this any time you return to the project or hit env errors
#  Usage:  zsh setup_env.sh
# =============================================================
set -e

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR"

VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON_BIN="python3"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           FinSense Environment Setup                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Check Python ───────────────────────────────────────────
echo "▶ [1/5] Checking Python..."
PY_VERSION=$($PYTHON_BIN --version 2>&1)
echo "    Using: $PY_VERSION at $(which $PYTHON_BIN)"

# ── 2. Create/Verify venv ─────────────────────────────────────
echo ""
echo "▶ [2/5] Checking virtual environment..."
if [[ -f "$VENV_DIR/bin/python" ]]; then
    VENV_PY_VER=$("$VENV_DIR/bin/python" --version 2>&1)
    echo "    ✅  Existing venv found: $VENV_PY_VER"
else
    echo "    Creating new virtual environment..."
    $PYTHON_BIN -m venv "$VENV_DIR"
    echo "    ✅  Virtual environment created."
fi

VENV_PY="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"

# ── 3. Install / upgrade dependencies ────────────────────────
echo ""
echo "▶ [3/5] Installing dependencies from requirements.txt..."
"$VENV_PIP" install --upgrade pip --quiet
"$VENV_PIP" install -r requirements.txt --quiet
echo "    ✅  All packages installed."

# ── 4. Register Jupyter kernel ───────────────────────────────
echo ""
echo "▶ [4/5] Registering Jupyter kernel 'finsense'..."
"$VENV_PY" -m ipykernel install --user --name finsense --display-name "FinSense (.venv)"
echo "    ✅  Kernel registered."

# ── 5. Smoke-test critical imports ───────────────────────────
echo ""
echo "▶ [5/5] Smoke-testing critical imports..."
"$VENV_PY" -c "
imports = [
    ('pygments',    'Pygments'),
    ('ipykernel',   'ipykernel'),
    ('numpy',       'NumPy'),
    ('pandas',      'Pandas'),
    ('matplotlib',  'Matplotlib'),
    ('sklearn',     'scikit-learn'),
    ('torch',       'PyTorch'),
]
ok = True
for mod, name in imports:
    try:
        m = __import__(mod)
        ver = getattr(m, '__version__', 'ok')
        print(f'    ✅  {name}: {ver}')
    except ImportError as e:
        print(f'    ❌  {name}: MISSING — {e}')
        ok = False
if not ok:
    raise SystemExit(1)
"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅  Environment ready! Happy coding on FinSense 🚀    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  • Activate venv:      source .venv/bin/activate"
echo "  • Open JupyterLab:    .venv/bin/jupyter lab"
echo "  • Kernel in VS Code:  Select 'FinSense (.venv)' from the kernel picker"
echo ""
