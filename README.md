# ECCA Sampling Project

This repo contains code related to the PSU STAT570 consulting project for ECCA.

## Data

All map data is imported from https://gisdata-wsdot.opendata.arcgis.com/, and in particular uses the following two datasets:

* WSDOT - State Route Linear Referencing System (LRS) Current
* WSDOT - State Route Ramp (1:24K) Current

These datasets were simply downloaded from the WSDAT as "shp" files, then the zip files were expanded under the "data" directory in this repo.

### Ramp identifiers

This is a rough guide to the ramp identifiers used in the "RouteID" column of the ramp data. The ID is a 9 character code, broken down as follows:

XXXYZMMMMM:

* XXX = state route (eg, "014")
* Y = S: North on-ramp
* Y = R: North off-ramp
* Y = Q: South on-ramp
* Y = P: South off-ramp
* Z = 1 or 5? (all samples are 1 except one 5)
* MMMMM = milepost MMM.MM (start milepost of ramp)

Example: 014P100978 => South off-ramp at mile 9.78 of state route 14

## Other WSDOT Tools

Milepost locator: https://wsdot.wa.gov/data/tools/Locatemp

This can find locations by milepost and route direction, but it's only accurate to two decimal places for the mileposts, so it could be off by 50 feet or so. Thus this is only useful for approximate locations.

This is another useful map tool: https://www.wsdot.wa.gov/mapsdata/tools/geoportal_ext.htm
