const conditionSeeds = [
  ['diabetes','Diabetes','Low glycemic, fiber-rich meals to support glucose control'],
  ['prediabetes','Prediabetes','Balanced meals focused on insulin sensitivity'],
  ['hypertension','High Blood Pressure (Hypertension)','Lower sodium, potassium-rich DASH-style eating'],
  ['hypotension','Low Blood Pressure (Hypotension)','Hydrating meals with balanced electrolytes'],
  ['kidney-disease','Kidney Disease','Moderate protein and controlled sodium/potassium choices'],
  ['iron-deficiency','Iron Deficiency','Iron-rich meals paired with vitamin C'],
  ['vitamin-deficiency','Vitamin Deficiency','Broad micronutrient-dense meal pattern'],
  ['vitamin-d-deficiency','Vitamin D Deficiency','Vitamin D, calcium, and protein focused plan'],
  ['vitamin-b12-deficiency','Vitamin B12 Deficiency','B12-rich foods with balanced macronutrients'],
  ['obesity','Obesity','Calorie-aware high-fiber meals for satiety'],
  ['underweight','Underweight','Energy-dense, nutrient-rich meals for healthy gain'],
  ['heart-disease','Heart Disease','Heart-protective meals rich in fiber and unsaturated fats'],
  ['high-cholesterol','High Cholesterol','Soluble-fiber meals with limited saturated fat'],
  ['liver-disease','Liver Disease','Gentle balanced meals with limited fried foods'],
  ['thyroid','Thyroid','Iodine, selenium, and steady-energy meals'],
  ['pcos','PCOS','Low-GI, high-protein meals for metabolic balance'],
  ['migraine','Migraine','Regular meals avoiding common trigger foods'],
  ['asthma','Asthma','Antioxidant-rich anti-inflammatory food pattern'],
  ['dengue-recovery','Dengue Recovery','Hydrating recovery meals with protein and micronutrients'],
  ['general-healthy-diet','General Healthy Diet','Balanced everyday nutrition']
];

const templates = {
  diabetes: [['Vegetable oats upma','Boiled egg whites','Guava slices','Unsweetened curd'],['2 phulka','Dal tadka','Mixed salad','Grilled paneer'],['Roasted chana','Buttermilk','Cucumber sticks','Walnuts'],['Moong dal soup','Stir-fried beans','Millet roti','Tofu cubes']],
  prediabetes: [['Besan chilla','Mint curd','Papaya','Flaxseed sprinkle'],['Brown rice','Rajma','Cabbage salad','Curd'],['Apple slices','Peanut butter','Green tea','Sprouts'],['Quinoa pulao','Dal','Sauteed spinach','Carrot salad']],
  hypertension: [['Idli','Sambar','Coconut chutney small','Orange'],['Low-salt khichdi','Curd','Beet salad','Steamed vegetables'],['Banana','Unsalted nuts','Lemon water','Roasted makhana'],['Chapati','Bottle gourd curry','Dal','Cucumber raita']],
  hypotension: [['Poha with peanuts','Banana','Salted lemon water','Curd'],['Rice','Dal','Spinach sabzi','Buttermilk'],['Coconut water','Dates','Roasted peanuts','Fruit chaat'],['Vegetable soup','Paneer bhurji','Chapati','Salad']],
  'kidney-disease': [['Suji upma','Apple','Herbal tea','Egg white'],['White rice','Lauki curry','Cucumber salad','Small curd'],['Rice flakes snack','Pear','Unsalted crackers','Clear soup'],['Chapati','Cauliflower sabzi','Dal small','Carrot salad']],
  'iron-deficiency': [['Ragi dosa','Sambar','Amla juice','Sesame chutney'],['Millet roti','Chana masala','Spinach salad','Lemon dressing'],['Dates','Roasted chana','Orange','Pumpkin seeds'],['Rajma soup','Brown rice','Beetroot salad','Curd']],
  'vitamin-deficiency': [['Vegetable omelette','Whole wheat toast','Mixed berries','Milk'],['Quinoa','Dal','Rainbow salad','Curd'],['Fruit bowl','Nuts','Sprouts','Coconut water'],['Chapati','Mixed veg curry','Paneer','Lentil soup']],
  'vitamin-d-deficiency': [['Fortified milk oats','Boiled eggs','Mushrooms','Orange'],['Fish curry or paneer','Rice','Greens','Curd'],['Fortified yogurt','Almonds','Fruit','Sunflower seeds'],['Tofu stir fry','Chapati','Dal','Salad']],
  'vitamin-b12-deficiency': [['Egg bhurji','Whole wheat toast','Milk','Fruit'],['Curd rice','Paneer curry','Salad','Dal'],['Yogurt smoothie','Nuts','Roasted chana','Apple'],['Fish/chicken or tofu','Chapati','Vegetables','Soup']],
  obesity: [['Vegetable dalia','Sprouts','Green tea','Apple'],['Millet roti','Dal','Large salad','Grilled tofu'],['Buttermilk','Makhana','Cucumber','Guava'],['Clear soup','Stir-fried vegetables','Paneer small','Chapati']],
  underweight: [['Peanut banana smoothie','Paneer paratha','Curd','Dates'],['Rice','Dal ghee tadka','Chicken/paneer','Salad'],['Trail mix','Lassi','Sweet potato','Boiled eggs'],['Chapati','Paneer curry','Quinoa','Vegetable soup']],
  'heart-disease': [['Oats porridge','Walnuts','Berries','Low-fat milk'],['Brown rice','Dal','Fish/tofu','Leafy salad'],['Apple','Flax crackers','Green tea','Unsalted nuts'],['Chapati','Mixed vegetables','Lentil soup','Curd']],
  'high-cholesterol': [['Oats','Chia seeds','Apple','Skim milk'],['Barley khichdi','Dal','Salad','Curd'],['Roasted makhana','Pear','Green tea','Almonds'],['Chapati','Soya curry','Vegetables','Soup']],
  'liver-disease': [['Idli','Sambar','Papaya','Curd'],['Rice','Moong dal','Pumpkin sabzi','Salad'],['Coconut water','Fruit','Roasted chana','Herbal tea'],['Chapati','Bottle gourd','Lentil soup','Steamed vegetables']],
  thyroid: [['Eggs or tofu','Millet toast','Brazil nuts','Fruit'],['Rice','Dal','Vegetable curry','Curd'],['Yogurt','Pumpkin seeds','Apple','Green tea'],['Chapati','Paneer/tofu','Spinach','Soup']],
  pcos: [['Moong chilla','Curd','Berries','Seeds'],['Quinoa','Chana','Salad','Buttermilk'],['Nuts','Apple','Sprouts','Green tea'],['Chapati','Dal','Vegetables','Paneer/tofu']],
  migraine: [['Oats','Banana','Milk','Pumpkin seeds'],['Rice','Dal','Carrot salad','Curd'],['Apple','Makhana','Herbal tea','Cucumber'],['Chapati','Vegetable stew','Tofu','Soup']],
  asthma: [['Besan chilla','Fruit','Curd','Tulsi tea'],['Brown rice','Dal','Leafy greens','Carrot salad'],['Citrus fruit','Nuts','Green tea','Sprouts'],['Chapati','Vegetable soup','Paneer/tofu','Salad']],
  'dengue-recovery': [['Soft idli','Sambar','Papaya','Coconut water'],['Rice kanji','Moong dal','Curd','Steamed carrot'],['ORS/lemon water','Banana','Soup','Dates'],['Khichdi','Paneer/tofu small','Vegetable broth','Fruit']],
  'general-healthy-diet': [['Oats','Egg/tofu scramble','Fruit','Milk'],['Chapati','Dal','Vegetable curry','Salad'],['Fruit','Nuts','Buttermilk','Sprouts'],['Rice/roti','Protein curry','Soup','Vegetables']]
};

const avoidMap = {
  diabetes: ['Sugary drinks','Refined sweets','White bread','Deep-fried snacks'],
  hypertension: ['High-salt pickles','Processed foods','Packaged chips','Excess caffeine'],
  hypotension: ['Alcohol','Skipping meals','Very low-salt diets','Dehydration'],
  'kidney-disease': ['Excess salt','Cola drinks','Processed meat','High-potassium foods unless approved'],
  obesity: ['Sugary beverages','Fried snacks','Large desserts','Refined flour foods'],
  underweight: ['Skipping meals','Empty-calorie sodas','Very low-fat diets','Excess junk food'],
  'heart-disease': ['Trans fats','Processed meat','Excess butter','Deep-fried foods'],
  'high-cholesterol': ['Trans fats','High-fat processed meat','Bakery shortening','Excess cheese'],
  migraine: ['Skipped meals','Aged cheese','Excess caffeine','Processed meats']
};

function makeItems(names, mealIndex) {
  return names.map((name, i) => ({
    name,
    calories: 90 + mealIndex * 90 + i * 22,
    protein: 4 + mealIndex * 4 + i,
    carbohydrates: 10 + mealIndex * 10 + i * 3,
    fat: 2 + mealIndex * 2 + i,
    fiber: 2 + i
  }));
}

function nutritionFor(key) {
  const base = key === 'underweight' ? 2300 : key === 'obesity' ? 1450 : key === 'diabetes' || key === 'prediabetes' ? 1550 : 1800;
  return { calories: base, protein: Math.round(base * 0.18 / 4), carbohydrates: Math.round(base * 0.48 / 4), fat: Math.round(base * 0.28 / 9), fiber: key === 'kidney-disease' ? 22 : 32 };
}

function waterFor(key) {
  if (key === 'kidney-disease') return 'As advised by doctor, commonly 1.5-2 L/day';
  if (key === 'dengue-recovery' || key === 'hypotension') return '3-3.5 L/day with electrolytes as needed';
  return '2.5-3 L/day';
}

const dietPlans = conditionSeeds.map(([key, name]) => {
  const meals = templates[key];
  return {
    slug: key + '-core-plan',
    name: name + ' Diet Plan',
    conditionKey: key,
    conditionName: name,
    breakfast: makeItems(meals[0], 0),
    lunch: makeItems(meals[1], 1),
    snacks: makeItems(meals[2], 0),
    dinner: makeItems(meals[3], 1),
    foodsToAvoid: avoidMap[key] || ['Excess sugar','Deep-fried foods','Highly processed foods','Skipping meals'],
    recommendedWaterIntake: waterFor(key),
    nutrition: nutritionFor(key),
    rotationGroup: key
  };
});

module.exports = { conditionSeeds, dietPlans };
