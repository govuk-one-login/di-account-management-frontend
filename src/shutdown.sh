#!/bin/bash

# Wait for 40 minutes (2400 seconds)
sleep 2400

# Stop Clinic Doctor and save the results
pkill -f 'clinic doctor'

# Optional: Copy results to S3
aws s3 cp ./clinic-doctor-results s3://clinic-doctor/clinic-results/ --recursive
