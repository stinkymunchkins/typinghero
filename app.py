import streamlit as st
import streamlit.components.v1 as components

# Read your files
with open("styles.css", "r", encoding="utf-8") as f:
    css = f"<style>{f.read()}</style>"

with open("script.js", "r", encoding="utf-8") as f:
    js = f"<script>{f.read()}</script>"

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Combine
full_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{css}
<style>
  html, body {{
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: none;
  }}
  iframe, .element-container {{
    width: 100% !important;
    height: 100% !important;
  }}
</style>
</head>
<body>
{html}
{js}
</body>
</html>
"""

# Configure Streamlit page to remove padding/background
st.set_page_config(page_title="Typing Hero", layout="wide")
st.markdown(
    """
    <style>
    .block-container {padding: 0 !important; margin: 0 !important;}
    .stApp {background-color: transparent !important;}
    </style>
    """,
    unsafe_allow_html=True
)

# Render full-screen iframe
components.html(full_html, height=1500, scrolling=False)
