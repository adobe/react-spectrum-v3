#!/usr/bin/env bash

port=4000
# usually defaults to https://registry.npmjs.com/
original_registry=`npm get registry`
registry="http://localhost:$port"
output="output.out"
ci=false
commit_to_revert="HEAD"

if [ "$1" = "ci" ];
then
  ci=true
fi

function cleanup {
  echo "Cleaning up"
  if [ "$ci" = false ];
  then
    lsof -ti tcp:4000 | xargs kill
    # Clean up generated dists if run locally
    rm -rf packages/**/dist
    rm -rf storage/ ~/.config/verdaccio/storage/ $output
    if [ "$commit_to_revert" != "HEAD" ];
    then
      git fetch
      git reset --hard $commit_to_revert
      npm set registry $original_registry
      yarn config set npmPublishRegistry $original_registry
      yarn config set npmRegistryServer $original_registry
    fi
  else
    # lsof doesn't work in circleci
    netstat -tpln | awk -F'[[:space:]/:]+' '$5 == 4000 {print $(NF-2)}' | xargs kill
  fi
}

trap cleanup EXIT
trap "exit 1" INT ERR

set -e
# Generate dists for the packages
make build

# Start verdaccio and send it to the background
yarn verdaccio --listen $port &>${output}&

# Wait for verdaccio to start
grep -q 'http address' <(tail -f $output)

# Login as test user
yarn npm-cli-login -u abc -p abc -e 'abc@abc.com' -r $registry
yarn config set npmPublishRegistry $registry
yarn config set npmRegistryServer $registry
yarn config set unsafeHttpWhitelist localhost
yarn config set npmAlwaysAuth true
npm set registry $registry
# Pause is important so that the username isn't interpreted as both username and password
(echo "abc"; sleep 2; echo "abc") | yarn npm login

if [ "$ci" = true ];
then
  git config --global user.email octobot@github.com
  git config --global user.name GitHub Actions
fi

# Bump all package versions (allow publish from current branch but don't push tags or commit)
yarn workspaces foreach --all --no-private version patch --deferred
yarn version apply --all

commit_to_revert="HEAD~0"

# Publish packages to verdaccio
yarn workspaces foreach --all --no-private -pt npm publish

if [ "$ci" = true ];
then
  echo 'build prod docs'
  cd starters/docs
  yarn config set npmRegistryServer $registry
  cd ../tailwind
  yarn config set npmRegistryServer $registry
  cd ../..
  # build prod docs with a public url of /reactspectrum/COMMIT_HASH_BEFORE_PUBLISH/verdaccio/docs
  PUBLIC_URL=/reactspectrum/`git rev-parse HEAD~0`/verdaccio/docs make website-production

  # Rename the dist folder from dist/production/docs to verdaccio_dist/COMMIT_HASH_BEFORE_PUBLISH/verdaccio/docs
  # This is so we can have verdaccio build in a separate stream from deploy and deploy_prod
  verdaccio_path=verdaccio_dist/`git rev-parse HEAD~0`/verdaccio
  mkdir -p $verdaccio_path
  mv dist/production/docs $verdaccio_path

  echo 'build rsp-cra-18'
  # install packages in CRA test app
  cd examples/rsp-cra-18
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable

  # Build CRA test app and move to dist folder. Store the size of the build in a text file.
  yarn build | tee build-stats.txt
  du -ka build/ | tee -a build-stats.txt
  mkdir -p ../../$verdaccio_path/publish-stats
  mv build-stats.txt ../../
  mv build ../../$verdaccio_path

  echo 'build webpack 4 test app'
  # install packages in webpack 4 test app
  cd ../../examples/rsp-webpack-4
  node ./scripts/prepareForProd.mjs
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn jest

  # Build Webpack 4 test app and move to dist folder. Store the size of the build in a text file.
  yarn build | tee build-stats.txt
  du -ka dist/ | tee -a webpack-4-build-stats.txt
  mv webpack-4-build-stats.txt ../../$verdaccio_path/publish-stats
  mv dist ../../$verdaccio_path/webpack-4

  echo 'build nextjs test app'
  # install packages in NextJS test app
  cd ../../examples/rsp-next-ts
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn test

  # Build NextJS test app and move to dist folder. Store the size of the build in a text file.
  VERDACCIO=true yarn build | tee next-build-stats.txt
  yarn export
  du -ka out/ | tee -a next-build-stats.txt
  mv next-build-stats.txt ../../$verdaccio_path/publish-stats
  mv out ../../$verdaccio_path/next

  echo 'build RAC Tailwind app'
  # Install/build RAC Tailwind app
  cd ../../examples/rac-tailwind
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn build --public-url ./
  mv dist ../../$verdaccio_path/rac-tailwind

  echo 'build RAC Spectrum Tailwind app'
  # Install/build RAC + Spectrum + Tailwind app
  cd ../../examples/rac-spectrum-tailwind
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn build --public-url ./
  mv dist ../../$verdaccio_path/rac-spectrum-tailwind

  echo 'build Spectrum 2 + Parcel test app'
  cd ../../examples/s2-parcel-example
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn build --public-url ./
  mv dist ../../$verdaccio_path/s2-parcel-example

  echo 'build Spectrum 2 + Webpack test app'
  cd ../../examples/s2-webpack-5-example
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn build
  mv dist ../../$verdaccio_path/s2-webpack-5-example

  echo 'build Spectrum 2 + Next.js test app'
  cd ../../examples/s2-next-macros
  yarn config set npmRegistryServer $registry
  yarn install --no-immutable
  yarn build
  mv out ../../$verdaccio_path/s2-next-macros

  echo 'test icon builder'
  cd ../../examples/s2-webpack-5-example
  mkdir icon-test
  cp ../../packages/@react-spectrum/s2/s2wf-icons/S2_Icon_3D_20_N.svg icon-test/S2_Icon_3D_20_N.svg
  npx @react-spectrum/s2-icon-builder -i ./icon-test/S2_Icon_3D_20_N.svg -o ./icon-dist

  cd ../..

  echo 'get size of each package published to verdaccio'
  # Get the tarball size of each published package.
  node scripts/verdaccioPkgSize.js

  echo 'compare sizes'
  # Compare the size of the built app and the published packages.
  node scripts/compareSize.js

  echo 'move to folder for azure'
  # Store into folder for azure.
  mv size-diff.txt build-stats.txt publish.json $verdaccio_path/publish-stats
else
  # Wait for user input to do cleanup
  read -n 1 -p "Press a key to close server and cleanup"
fi
