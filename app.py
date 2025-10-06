import streamlit as st
import streamlit.components.v1 as components

# Read all three files
with open("styles.css", "r", encoding="utf-8") as f:
    css = f"<style>{f.read()}</style>"

with open("script.js", "r", encoding="utf-8") as f:
    js = f"<script>{f.read()}</script>"

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Inject CSS + HTML + JS
full_html = f"""
<html>
<head>
<meta charset="utf-8">
{css}
</head>
<body>
{html}
{js}
</body>
</html>
"""

# Render inside Streamlit
components.html(full_html, height=1000, scrolling=True)
