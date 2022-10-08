#!/bin/bash


cp LICENSE ./dist/packages/azure-functions

tar -zcf release.tar.gz dist/packages/azure-functions/
zip -rq release.zip dist/packages/azure-functions/
