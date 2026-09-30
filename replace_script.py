import os
import re

with open('frontend/src/pages/admin/AdminProducts.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('AdminProducts', 'AdminParts')
code = code.replace('useProductStore', 'usePartStore')
code = code.replace('productService', 'partService')
code = code.replace('ProductCard', 'AdminPartCard')
code = code.replace('SortableProductRow', 'SortablePartRow')
code = code.replace('reorderProducts', 'reorderParts')
code = code.replace('filteredProducts', 'filteredParts')

# Word boundary replacements
code = re.sub(r'\bproducts\b', 'parts', code)
code = re.sub(r'\bProducts\b', 'Parts', code)
code = re.sub(r'\bproduct\b', 'part', code)
code = re.sub(r'\bProduct\b', 'Part', code)

code = code.replace('machine', 'part')
code = code.replace('Machine', 'Part')
code = code.replace('MACHINERY_CATEGORIES', 'PARTS_CATEGORIES')
code = code.replace('import { PARTS_CATEGORIES } from "@/data/parts";', 'import { PARTS_CATEGORIES } from "@/data/partsData";')
code = code.replace('import { PARTS_CATEGORIES } from "@/constants/categories";', 'import { PARTS_CATEGORIES } from "@/data/partsData";')

# Write output
with open('frontend/src/pages/admin/AdminParts.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Replacement successful")
