const express = require('express');
const { trace, context } = require('@opentelemetry/api');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { MeterProvider } = require('@opentelemetry/sdk-metrics-base');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const winston = require('winston'); // Import winston for logging
require('./otel');  // Import OpenTelemetry initialization (optional setup)

const app = express();
app.use(express.json());

// Set up OpenTelemetry Tracer
const provider = new NodeTracerProvider();
provider.register();

// Set up Prometheus Exporter for metrics
const prometheusExporter = new PrometheusExporter({ startServer: true }, () => {
  console.log('Prometheus scraping server started on http://localhost:9464');
});

// Set up MeterProvider and Prometheus metrics
const meterProvider = new MeterProvider();
meterProvider.addMetricReader(prometheusExporter);
const meter = meterProvider.getMeter('example-meter');

// Create counter metrics
const addButtonClicks = meter.createCounter('add_button_clicks_total', {
  description: 'Counts Add button clicks',
});
const deleteButtonClicks = meter.createCounter('delete_button_clicks_total', {
  description: 'Counts Delete button clicks',
});
const listUpdates = meter.createCounter('list_updates_total', {
  description: 'Counts task list updates',
});

// Set up logging using winston
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/telemetry.log', level: 'info' }) // Log to a file
  ],
});

// POST endpoint to handle telemetry data
app.post('/send-telemetry', (req, res) => {
  const { eventType, message } = req.body;
  const tracer = trace.getTracer('example-tracer');
  
  // Start a span for tracing
  const span = tracer.startSpan(eventType);
  span.setAttribute('service.name', 'ReactNativeApp');
  span.addEvent(eventType);

  // Log the incoming request
  logger.info(`Event received: ${eventType}`, {
    traceId: span.spanContext().traceId,
    message
  });

  // Increment appropriate metric counters
  if (eventType === 'add_button_click') {
    addButtonClicks.add(1, { service: 'ReactNativeApp' });
  } else if (eventType === 'delete_button_click') {
    deleteButtonClicks.add(1, { service: 'ReactNativeApp' });
  } else if (eventType === 'list_update') {
    listUpdates.add(1, { service: 'ReactNativeApp' });
  }

  span.end();
  res.status(200).send({ message: 'Telemetry data sent successfully' });
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Prometheus metrics exposed at http://localhost:9464/metrics');
});
