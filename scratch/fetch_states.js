const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Successfully fetched and parsed data.');
      
      // Let's print out all state names in the downloaded JSON to see how they map
      const fetchedStates = parsed.states.map(s => s.state);
      console.log('Fetched states:', fetchedStates);

      // Now let's structure them
      const stateDistrictsMap = {};
      
      parsed.states.forEach((item) => {
        let stateName = item.state;
        
        // Map names to match our existing keys in localization.ts
        if (stateName === 'Chandigarh (UT)') {
          stateName = 'Chandigarh';
        } else if (stateName === 'Delhi (NCT)') {
          stateName = 'Delhi';
        } else if (stateName === 'Dadra and Nagar Haveli (UT)') {
          stateName = 'Dadra and Nagar Haveli and Daman and Diu';
        } else if (stateName === 'Daman and Diu (UT)') {
          // Daman and Diu are now merged, so we will merge them under "Dadra and Nagar Haveli and Daman and Diu"
          stateName = 'Dadra and Nagar Haveli and Daman and Diu';
        } else if (stateName === 'Jammu and Kashmir') {
          stateName = 'Jammu and Kashmir';
        } else if (stateName === 'Ladakh (UT)') {
          stateName = 'Ladakh';
        } else if (stateName === 'Lakshadweep (UT)') {
          stateName = 'Lakshadweep';
        } else if (stateName === 'Puducherry (UT)') {
          stateName = 'Puducherry';
        } else if (stateName === 'Andaman and Nicobar Islands (UT)') {
          stateName = 'Andaman and Nicobar Islands';
        }

        const cleanDistricts = item.districts.map(d => d.trim()).filter(Boolean);
        
        if (stateDistrictsMap[stateName]) {
          // Merge districts (e.g. for Dadra & Nagar Haveli and Daman & Diu)
          const merged = new Set([...stateDistrictsMap[stateName], ...cleanDistricts]);
          stateDistrictsMap[stateName] = Array.from(merged).sort();
        } else {
          stateDistrictsMap[stateName] = cleanDistricts.sort();
        }
      });

      // Let's make sure we also add Lakshadweep if not present, and any other missing states
      if (!stateDistrictsMap['Lakshadweep']) {
        stateDistrictsMap['Lakshadweep'] = ['Kavaratti'];
      }

      // Format as TypeScript code
      let tsContent = 'export const stateDistricts: Record<string, string[]> = {\n';
      const sortedStates = Object.keys(stateDistrictsMap).sort();
      sortedStates.forEach((state) => {
        tsContent += `  "${state}": ${JSON.stringify(stateDistrictsMap[state])},\n`;
      });
      tsContent += '};\n\n';
      tsContent += 'export const allStates = Object.keys(stateDistricts).sort();\n';

      const targetPath = path.join(__dirname, '..', 'src', 'lib', 'localization.ts');
      fs.writeFileSync(targetPath, tsContent, 'utf-8');
      console.log('Successfully wrote to src/lib/localization.ts');

    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (e) => {
  console.error('Error fetching data:', e);
});
