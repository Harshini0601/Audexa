import os

def cleanup_audio_folder():
    folder = "static/audio"
    for file in os.listdir(folder):
        if file.endswith(".mp3"):
            os.remove(os.path.join(folder, file))