const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { context, trace } = require('@opentelemetry/api');

// Initialize the tracer provider
const provider = new NodeTracerProvider();
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  tracerProvider: provider,
});

console.log('OpenTelemetry setup complete');

// Create a test span
const tracer = trace.getTracer('example-tracer');
const span = tracer.startSpan('manual-test-span');
span.addEvent('Event: Start');

setTimeout(() => {
  span.addEvent('Event: End');
  span.end();
  console.log('Test span sent.');
}, 2000);
