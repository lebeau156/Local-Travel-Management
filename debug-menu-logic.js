// Add this temporarily to Layout.tsx to debug the menu

console.log('=== MENU DEBUG ===');
console.log('Position:', position);
console.log('isSCSI:', isSCSI);
console.log('isFLS:', isFLS);
console.log('isDDM:', isDDM);
console.log('isDM:', isDM);

const menuItems = [];

// DM Dashboard
if (isDM) {
  menuItems.push('DM Dashboard');
  console.log('✅ Adding DM Dashboard');
}

// DDM Dashboard  
if (isDDM && !isDM) {
  menuItems.push('DDM Dashboard');
  console.log('✅ Adding DDM Dashboard');
}

// FLS Dashboard
if (isFLS && !isDDM && !isDM) {
  menuItems.push('FLS Dashboard');
  console.log('✅ Adding FLS Dashboard');
}

// SCSI Dashboard
if (isSCSI && !isFLS && !isDDM && !isDM) {
  menuItems.push('SCSI Dashboard');
  console.log('✅ Adding SCSI Dashboard');
}

// Generic Dashboard
if (!isSCSI && !isFLS && !isDDM && !isDM) {
  menuItems.push('Generic Dashboard');
  console.log('✅ Adding Generic Dashboard');
}

console.log('Total My Dashboard items:', menuItems.length);
console.log('Items:', menuItems);
console.log('==================');
