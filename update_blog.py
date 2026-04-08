import os
import json

POSTS_ROOT = './root/'

# Don't add media to the index. We will serve media files directly from the filesystem 
# instead of through the index, so we don't need them in the manifest.
IGNORE_DIRS = ['./root/media']

def createManifest(name="root", manifest_root=POSTS_ROOT):
    manifest = {}
    manifest["name"] = name
    manifest["files"] = []
    manifest["dirs"] = []

    for file in os.listdir(manifest_root):
        full_path = os.path.join(manifest_root, file)

        if os.path.isdir(full_path):
            should_ignore = False
            for ignore_dir in IGNORE_DIRS:
                if os.path.samefile(ignore_dir, full_path):
                    should_ignore = True
            
            if not should_ignore:
                print(f'Adding {full_path}')
                manifest["dirs"].append(createManifest(name=file, 
                                                    manifest_root=full_path))
            else:
                print(f'Ignoring {full_path}')

        elif file.endswith(".md"):
            print(f'Adding {full_path}')
            st = os.stat(full_path)
            timestamp_created = st.st_birthtime
            timestamp_modified = st.st_mtime
            manifest["files"].append({ "timestamp_created": timestamp_created, 
                                      "timestamp_modified": timestamp_modified, 
                                      "name": file })
        
    return manifest


fp = open("data.json", "w")
json.dump(createManifest(), fp)