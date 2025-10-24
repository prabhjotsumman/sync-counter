#!/usr/bin/env node

/**
 * Test script to verify unique color assignment for different users
 * This script tests the color assignment logic without running the full app
 */

const DEFAULT_USER_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
];

/**
 * Simulate the assignUniqueColor logic
 */
async function assignUniqueColor(username, assignedColors, allServerColors = {}) {
  // Get all currently assigned colors (simulating both local and server)
  const allAssignedColors = new Set([...assignedColors, ...Object.values(allServerColors)]);

  // Find the first available color that isn't assigned to any user
  const availableColor = DEFAULT_USER_COLORS.find(color => !allAssignedColors.has(color));

  if (availableColor) {
    return availableColor;
  }

  // If all colors are taken, assign based on username hash as fallback
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  let colorIndex = Math.abs(hash) % DEFAULT_USER_COLORS.length;
  let attempts = 0;

  // Find a color that isn't currently assigned
  while (allAssignedColors.has(DEFAULT_USER_COLORS[colorIndex]) && attempts < DEFAULT_USER_COLORS.length) {
    colorIndex = (colorIndex + 1) % DEFAULT_USER_COLORS.length;
    attempts++;
  }

  return DEFAULT_USER_COLORS[colorIndex];
}

/**
 * Test the color assignment logic
 */
async function testColorAssignment() {
  console.log('🧪 Testing Unique Color Assignment\n');

  const testUsers = ['Prabh', 'Major singh', 'Alice', 'Bob', 'Charlie', 'David'];
  const assignedColors = [];

  for (const username of testUsers) {
    const color = await assignUniqueColor(username, assignedColors);
    assignedColors.push(color);

    console.log(`✅ ${username} → ${color}`);
  }

  console.log('\n📊 Results:');
  console.log(`- Total users: ${testUsers.length}`);
  console.log(`- Unique colors assigned: ${new Set(assignedColors).size}`);
  console.log(`- Colors used: ${Array.from(new Set(assignedColors)).join(', ')}`);

  // Check for duplicates
  const duplicates = assignedColors.filter((color, index) => assignedColors.indexOf(color) !== index);

  if (duplicates.length === 0) {
    console.log('\n🎉 SUCCESS: All users got unique colors!');
  } else {
    console.log(`\n❌ FAILED: Found duplicate colors: ${duplicates.join(', ')}`);
  }
}

// Run the test
testColorAssignment().catch(console.error);
