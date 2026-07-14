const { NextResponse } = require('next/server');
const { AppError } = require('./errors');

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

function fail(err) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
}

module.exports = { json, fail };
