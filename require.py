
# Project: PyRequire
# Author: Effyiex
# Description: An api which helps implementing libraries into ur project.

import os, sys

from urllib.request import urlopen as download

from importlib import import_module

ORIGIN_DIRECTORY = sys.path[0].replace('\\', '/')
LIBRARY_DIRECTORY = f"{ORIGIN_DIRECTORY}/__libraries__"

sys.path.append(LIBRARY_DIRECTORY)

if not os.path.exists(LIBRARY_DIRECTORY):
    os.mkdir(LIBRARY_DIRECTORY)

def extract_file_name(url):
    parts = url.replace('\\', '/').split('/')
    file_name = "unknown.py"
    for part in parts:
        if ".py" in part:
            file_name = part
            break
    return file_name

def require_pip(lib):
    module = None
    try:
        module = import_module(lib)
    except:
        os.system(f"py -m pip install {lib}")
        module = import_module(lib)
    return module

def require_url(url):
    file_name = extract_file_name(url)
    file_path = f"{LIBRARY_DIRECTORY}/{file_name}"
    if not os.path.exists(file_path):
        file_download = download(url)
        file_buffer = file_download.read()
        file_download.close()
        file_instance = open(file_path, "wb")
        file_instance.write(file_buffer)
        file_instance.close()
    module_name = file_name.replace(".py", str())
    return import_module(module_name)
