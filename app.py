import streamlit as st
import streamlit.components.v1 as components

# Load your local HTML file
with open("index.html", "r", encoding="utf-8") as f:
    html_code = f.read()

# Render it inside Streamlit
components.html(html_code, height=900, scrolling=True)
