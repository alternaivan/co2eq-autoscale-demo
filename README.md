# Carbon Intensity Scaling App Demo

This repository contains application code and deployment for a simple application that scales based on the reported carbon intensity in gCO2eq/kwh.

## Build

Build of the application is done by running the following command:

```shell
cd app/
docker build . -t test:v1
```

## Run locally

The prerequisite for running this applications are:
- Electricity Maps API key that you can get by creating account on Electricity Maps platform
- Zone which you want to monitor.

To run the application locally and test out the API endpoint, run the following command:
```shell
docker run -ti -e ELECTRICITY_MAPS_API_KEY=<API-KEY> -e ZONE=<REGION> --rm test:v1
```

You should get some output like below:
```
Fetching carbon intensity data...
Server running on port 8080
Metrics available at http://localhost:8080/metrics
Using ElectricityMaps API for zone: DE
Carbon intensity will be updated every 1 minutes
Carbon intensity updated: 191 gCO2eq/kWh
```

## Run in Kubernetes Cluster

To run this application in Kubernetes cluster, you would need to do the following:
- install Prometheus (prefered kube-prometheus-stack)
- install KEDA

After you have everything installed, you can apply the application to the namespace.
```
kubectl apply -k deploy/
```
