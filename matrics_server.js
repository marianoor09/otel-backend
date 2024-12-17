const express = require('express');
const { trace, context } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
require('./otel');  // Import OpenTelemetry initialization

const app = express();
app.use(express.json());

// Set up OpenTelemetry Tracer
const provider = new NodeTracerProvider();
provider.register();

// Set up Prometheus Exporter for metrics
const prometheusExporter = new PrometheusExporter({ startServer: true }, () => {
  console.log('Prometheus scraping server started on http://localhost:9464');
});

// Create the MeterProvider and add the Prometheus Exporter using addMetricReader
const meterProvider = new MeterProvider();
meterProvider.addMetricReader(prometheusExporter);  // Correct method to add the Prometheus Exporter

const meter = meterProvider.getMeter('example-meter');

// Example: Create a counter metric for telemetry data
const requestCounter = meter.createCounter('button_clicks', {
  description: 'Counts button clicks',
});

// Handling the POST request
app.post('/send-telemetry', (req, res) => {
  const tracer = trace.getTracer('example-tracer');
  const span = tracer.startSpan('button-click');  // Create a new span

  span.setAttribute('service.name', 'ReactNativeApp');
  span.addEvent('button-clicked');
  
  // Increment the counter metric
  requestCounter.add(1, { service: 'ReactNativeApp' });

  // Simulate a delay and send the response
  setTimeout(() => {
    span.end();  // End the span
    res.status(200).send({ message: 'Telemetry data sent' });
  }, 1000);
});

// Set up server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Prometheus metrics exposed at http://localhost:9464/metrics');
});
