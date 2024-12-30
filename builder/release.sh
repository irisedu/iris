#!/usr/bin/env bash

# Release script for macOS
# Environment:
# - node 20.x
# - pnpm
# - git

SCRIPT_DIR=$(cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd)
VERSION=$1

if [[ -z $VERSION ]]; then
	echo "Build failed: no version specified!"
	exit 1
fi

if [ ! -f $SCRIPT_DIR/distConfig.json ]; then
	echo "Build failed: distConfig.json is not present!"
	exit 1
fi

# Cut release
echo "Cutting release v$VERSION..."
git pull

set_version() {
	pushd $SCRIPT_DIR/../packages/$1
	pnpm version $VERSION
	git add package.json
	popd
}

set_version iris-studio
set_version iris-frontend
set_version iris-backend

git commit -m "v$VERSION"
git tag v$VERSION

# Build artifacts
cp -v $SCRIPT_DIR/distConfig.json $SCRIPT_DIR/../packages/patchouli/src/

pushd $SCRIPT_DIR/../packages/iris-studio

pnpm --filter iris-studio... install
pnpm build
pnpm dist:all

popd

rm -rf $SCRIPT_DIR/dist
mv -v $SCRIPT_DIR/../packages/iris-studio/dist $SCRIPT_DIR

echo "Done!"
