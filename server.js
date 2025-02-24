import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

const app = express();
const port = 3000;

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Routes for Length Conversion
app.get('/', (req, res) => servePage('length.html', res));
app.post('/', (req, res) => handleConversion('length', req, res));

// Routes for Weight Conversion
app.get('/weight', (req, res) => servePage('weight.html', res));
app.post('/weight', (req, res) => handleConversion('weight', req, res));

// Routes for Temperature Conversion
app.get('/temperature', (req, res) => servePage('temperature.html', res));
app.post('/temperature', (req, res) => handleConversion('temperature', req, res));

/**
 * Serves an HTML page for the given conversion type.
 * Reads the HTML file from the filesystem and sends it as a response.
 * 
 * @param {string} page - The name of the HTML file to be served.
 * @param {object} res - Express response object.
 */
function servePage(page, res) {
  fs.readFile(page, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error loading page');
    } else {
      res.send(data.replace('<!-- RESULT -->', ''));
    }
  });
}

/**
 * Handles unit conversion based on the requested type (length, weight, temperature).
 * Processes the request data, performs the conversion, and updates the response HTML.
 * 
 * @param {string} type - The type of conversion (length, weight, temperature).
 * @param {object} req - Express request object containing input values.
 * @param {object} res - Express response object.
 */
function handleConversion(type, req, res) {
  const { value, fromUnit, toUnit } = req.body;
  let result;
  
  try {
    switch (type) {
      case 'length':
        result = convertLength(value, fromUnit, toUnit);
        break;
      case 'weight':
        result = convertWeight(value, fromUnit, toUnit);
        break;
      case 'temperature':
        result = convertTemperature(value, fromUnit, toUnit);
        break;
      default:
        throw new Error('Invalid conversion type');
    }
    
    // Read the respective HTML file and inject the conversion result
    fs.readFile(`${type}.html`, 'utf8', (err, data) => {
      if (err) throw err;
      
      const resultHtml = `
        <div id="resultSection" style="display: block">
          <h2>Result of your calculation</h2>
          <div class="result-text">${value} ${fromUnit} = ${result} ${toUnit}</div>
          <button onclick="resetForm()">Reset</button>
        </div>
        <script>
          document.getElementById('conversionSection').style.display = 'none';
          
          function resetForm() {
            document.getElementById('conversionSection').style.display = 'block';
            document.getElementById('resultSection').style.display = 'none';
            document.querySelector('form').reset();
          }
        </script>
      `;
      
      res.send(data.replace('<!-- RESULT -->', resultHtml));
    });
  } catch (error) {
    res.status(400).send('Invalid conversion');
  }
}

/**
 * Converts length units based on a predefined conversion factor.
 * 
 * @param {number} value - The numerical value to be converted.
 * @param {string} fromUnit - The unit of the input value.
 * @param {string} toUnit - The target unit for conversion.
 * @returns {string} - The converted value rounded to two decimal places.
 */
function convertLength(value, fromUnit, toUnit) {
  const factors = {
    millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000,
    inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.34
  };
  return (value * factors[fromUnit] / factors[toUnit]).toFixed(2);
}

/**
 * Converts weight units based on a predefined conversion factor.
 * 
 * @param {number} value - The numerical value to be converted.
 * @param {string} fromUnit - The unit of the input value.
 * @param {string} toUnit - The target unit for conversion.
 * @returns {string} - The converted value rounded to two decimal places.
 */
function convertWeight(value, fromUnit, toUnit) {
  const factors = {
    milligram: 0.000001, gram: 0.001, kilogram: 1,
    ounce: 0.0283495, pound: 0.453592
  };
  return (value * factors[fromUnit] / factors[toUnit]).toFixed(2);
}

/**
 * Converts temperature values between Celsius, Fahrenheit, and Kelvin.
 * 
 * @param {number} value - The temperature value to be converted.
 * @param {string} fromUnit - The original temperature unit.
 * @param {string} toUnit - The target temperature unit.
 * @returns {string} - The converted temperature rounded to two decimal places.
 */
function convertTemperature(value, fromUnit, toUnit) {
  const factors = {
    Celsius: 1,
    Fahrenheit: 0.555556,
    Kelvin: 1
  };
  
  const offsets = {
    Celsius: 0,
    Fahrenheit: 32,
    Kelvin: 273.15
  };

  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) {
    throw new Error('Invalid temperature value');
  }

  if (fromUnit === toUnit) {
    return numericValue.toFixed(2);
  }

  // Convert to Celsius first
  const celsiusValue = (numericValue - offsets[fromUnit]) * factors[fromUnit];
  
  // Convert from Celsius to the target unit
  const result = (celsiusValue / factors[toUnit]) + offsets[toUnit];
  
  return result.toFixed(2);
}

// Start the Express server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
