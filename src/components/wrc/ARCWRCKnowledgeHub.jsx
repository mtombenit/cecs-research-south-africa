import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from "recharts";

const D = {"total":817,"cat_counts":{"Pharmaceuticals & PPCPs":381,"Microplastics":108,"Polycyclic Aromatic Hydrocarbons":85,"Antiretrovirals (ARVs)":78,"Pesticides":51,"Heavy Metals":42,"Alkylphenols & APEOs":40,"Microbial CECs":27,"Nanomaterials":5},"prov_cat":{"KwaZulu-Natal":{"Pharmaceuticals & PPCPs":65,"Microplastics":82,"Polycyclic Aromatic Hydrocarbons":16,"Antiretrovirals (ARVs)":78,"Pesticides":5,"Heavy Metals":2,"Alkylphenols & APEOs":0,"Microbial CECs":5,"Nanomaterials":0},"Eastern Cape":{"Pharmaceuticals & PPCPs":150,"Microplastics":6,"Polycyclic Aromatic Hydrocarbons":31,"Antiretrovirals (ARVs)":0,"Pesticides":9,"Heavy Metals":4,"Alkylphenols & APEOs":0,"Microbial CECs":1,"Nanomaterials":0},"Gauteng":{"Pharmaceuticals & PPCPs":60,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":0,"Antiretrovirals (ARVs)":0,"Pesticides":9,"Heavy Metals":6,"Alkylphenols & APEOs":11,"Microbial CECs":4,"Nanomaterials":0},"Western Cape":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":16,"Antiretrovirals (ARVs)":0,"Pesticides":14,"Heavy Metals":2,"Alkylphenols & APEOs":0,"Microbial CECs":1,"Nanomaterials":2},"North West":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":0,"Antiretrovirals (ARVs)":0,"Pesticides":6,"Heavy Metals":1,"Alkylphenols & APEOs":22,"Microbial CECs":0,"Nanomaterials":1},"Free State":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":0,"Antiretrovirals (ARVs)":0,"Pesticides":3,"Heavy Metals":3,"Alkylphenols & APEOs":0,"Microbial CECs":0,"Nanomaterials":2},"Mpumalanga":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":0,"Antiretrovirals (ARVs)":0,"Pesticides":0,"Heavy Metals":24,"Alkylphenols & APEOs":0,"Microbial CECs":2,"Nanomaterials":0},"Limpopo":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":16,"Antiretrovirals (ARVs)":0,"Pesticides":0,"Heavy Metals":0,"Alkylphenols & APEOs":0,"Microbial CECs":0,"Nanomaterials":0},"Northern Cape":{"Pharmaceuticals & PPCPs":0,"Microplastics":0,"Polycyclic Aromatic Hydrocarbons":0,"Antiretrovirals (ARVs)":0,"Pesticides":0,"Heavy Metals":0,"Alkylphenols & APEOs":0,"Microbial CECs":0,"Nanomaterials":0}},"sites":[{"site":"Vaal River","lat":-27.397631,"lon":26.50597,"province":"North West","wbt":"Unclassified","n_cats":2,"n_contaminants":9,"cats":["Alkylphenols & APEOs","Pesticides"]},{"site":"Kookfontein 454 IQ Meyerton WWTW","lat":-26.57972,"lon":27.98916,"province":"Gauteng","wbt":"WWTP","n_cats":1,"n_contaminants":7,"cats":["Alkylphenols & APEOs"]},{"site":"Rietspruit Weir","lat":-26.12472,"lon":27.121667,"province":"North West","wbt":"Surface Water","n_cats":1,"n_contaminants":7,"cats":["Alkylphenols & APEOs"]},{"site":"Gold Mine Water","lat":-27.38,"lon":28.27,"province":"North West","wbt":"Unclassified","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"Polokwane municipality","lat":-23.860016,"lon":29.44464824,"province":"Mpumalanga","wbt":"WWTP","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"Siliom Geothermal Spring","lat":-22.893753,"lon":30.1980549,"province":"Mpumalanga","wbt":"Unclassified","n_cats":1,"n_contaminants":4,"cats":["Heavy Metals"]},{"site":"Umtata River","lat":-31.0,"lon":29.18333,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"Limpopo natural wetland","lat":-22.89764,"lon":30.04792,"province":"Mpumalanga","wbt":"Surface Water","n_cats":1,"n_contaminants":4,"cats":["Heavy Metals"]},{"site":"Umtata Dam","lat":-31.501,"lon":28.7068,"province":"Eastern Cape","wbt":"Unclassified","n_cats":1,"n_contaminants":2,"cats":["Heavy Metals"]},{"site":"Gold Mine water","lat":-27.63333,"lon":28.45,"province":"Free State","wbt":"Unclassified","n_cats":1,"n_contaminants":3,"cats":["Heavy Metals"]},{"site":"Muledzane   District","lat":-22.9895,"lon":30.50164,"province":"Mpumalanga","wbt":"Groundwater","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"Nzhelele River","lat":-22.35222,"lon":30.37194,"province":"Mpumalanga","wbt":"Unclassified","n_cats":1,"n_contaminants":2,"cats":["Heavy Metals"]},{"site":"Gauteng CarWash effluent","lat":-26.19363658,"lon":28.0400146,"province":"Gauteng","wbt":"Unclassified","n_cats":1,"n_contaminants":3,"cats":["Heavy Metals"]},{"site":"Polokwane Municipality","lat":-23.86158572,"lon":29.44464824,"province":"Mpumalanga","wbt":"WWTP","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"Phillipi Horticulture area","lat":-34.01667,"lon":18.55,"province":"Western Cape","wbt":"Agricultural Water","n_cats":1,"n_contaminants":2,"cats":["Heavy Metals"]},{"site":"WWTP Vaal Battery Industry","lat":-26.5969,"lon":27.9015,"province":"Gauteng","wbt":"Unclassified","n_cats":1,"n_contaminants":3,"cats":["Heavy Metals"]},{"site":"Blyde River","lat":-24.953,"lon":29.961,"province":"Mpumalanga","wbt":"Unclassified","n_cats":1,"n_contaminants":4,"cats":["Heavy Metals"]},{"site":"Mhlathuze estuary","lat":-28.8,"lon":32.05,"province":"KwaZulu-Natal","wbt":"Sediment","n_cats":1,"n_contaminants":2,"cats":["Heavy Metals"]},{"site":"Thohoyandou","lat":-23.0028526261672,"lon":30.4760206710814,"province":"Mpumalanga","wbt":"WWTP","n_cats":1,"n_contaminants":1,"cats":["Heavy Metals"]},{"site":"The community from which samples were obtained is located in a valley in the Vhembe District","lat":-22.9662,"lon":30.457,"province":"Mpumalanga","wbt":"Surface Water","n_cats":1,"n_contaminants":2,"cats":["Microbial CECs"]},{"site":"The Plankenburg River (Western Cape)","lat":-33.8955,"lon":18.8348,"province":"Western Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Microbial CECs"]},{"site":"Umgeni River KZN","lat":-29.4029,"lon":30.5119,"province":"KwaZulu-Natal","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Microbial CECs"]},{"site":"Olifants River","lat":-25.7949,"lon":29.3209,"province":"Gauteng","wbt":"Unclassified","n_cats":1,"n_contaminants":4,"cats":["Microbial CECs"]},{"site":"Buffalo City WWTPs (Eastern Cape)","lat":-32.8487,"lon":27.4388,"province":"Eastern Cape","wbt":"WWTP","n_cats":1,"n_contaminants":1,"cats":["Microbial CECs"]},{"site":"Durban Bay Beach","lat":-29.866667,"lon":31.066667,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":5,"cats":["Microplastics"]},{"site":"uMgeni Estuary","lat":-29.812316,"lon":31.039761,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":8,"cats":["Microplastics"]},{"site":"Isipingo Estuary","lat":-30.0,"lon":30.95,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":6,"cats":["Microplastics"]},{"site":"Mdloti Estuary","lat":-29.633333,"lon":31.133333,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":6,"cats":["Microplastics"]},{"site":"St Lucia Estuary","lat":-28.366822,"lon":32.410461,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":3,"cats":["Microplastics"]},{"site":"Durban Harbour Estuary","lat":-29.877161,"lon":31.050347,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":4,"cats":["Microplastics"]},{"site":"Sodwana","lat":-27.539833,"lon":32.67832,"province":"KwaZulu-Natal","wbt":"Unclassified","n_cats":1,"n_contaminants":3,"cats":["Microplastics"]},{"site":"Durban Bay","lat":-29.870448,"lon":31.020298,"province":"KwaZulu-Natal","wbt":"Unclassified","n_cats":1,"n_contaminants":4,"cats":["Microplastics"]},{"site":"NW Dam","lat":-25.83085296,"lon":25.6411613,"province":"North West","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Nanomaterials"]},{"site":"WC1 Dam","lat":-34.01905223,"lon":18.58171656,"province":"Western Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Nanomaterials"]},{"site":"FS Dam","lat":-29.03291876,"lon":26.11128747,"province":"Free State","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Nanomaterials"]},{"site":"Umgeni Business Park/Umgeni River","lat":-29.8052,"lon":30.9827,"province":"KwaZulu-Natal","wbt":"Surface Water","n_cats":1,"n_contaminants":2,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Crocodile River","lat":-25.7659,"lon":27.8939,"province":"Gauteng","wbt":"Unclassified","n_cats":1,"n_contaminants":5,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Hartbeespoort Dam Wall","lat":-25.728,"lon":27.8497,"province":"Gauteng","wbt":"Surface Water","n_cats":1,"n_contaminants":5,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Jukskei River","lat":-26.0096276645417,"lon":28.0371032196409,"province":"Gauteng","wbt":"Surface Water","n_cats":2,"n_contaminants":8,"cats":["Pharmaceuticals & PPCPs","Pesticides"]},{"site":"Umgeni River Sediment","lat":-29.8113,"lon":31.0374,"province":"KwaZulu-Natal","wbt":"Unclassified","n_cats":1,"n_contaminants":9,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Palmiet River P1","lat":-33.369625,"lon":26.476542,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":2,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Bloukrans River","lat":-33.314295,"lon":26.551907,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":4,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Buffalo River B1","lat":-32.789741,"lon":27.369707,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":3,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Swartkops S1","lat":-33.716609,"lon":25.288034,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":2,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Tyhume T1","lat":-32.610883,"lon":26.909413,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":2,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Msunduzi Town (MST)","lat":-30.6362,"lon":29.6612,"province":"Eastern Cape","wbt":"Sediment","n_cats":1,"n_contaminants":7,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Darvill WWTP Influent","lat":-30.4312,"lon":29.6043,"province":"Eastern Cape","wbt":"Sediment","n_cats":1,"n_contaminants":8,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Umbilo WWTP in KZN","lat":-29.8455,"lon":30.891,"province":"KwaZulu-Natal","wbt":"WWTP","n_cats":1,"n_contaminants":3,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Olifantfontein WWTP","lat":-25.9391,"lon":28.2115,"province":"Gauteng","wbt":"Unclassified","n_cats":1,"n_contaminants":4,"cats":["Pharmaceuticals & PPCPs"]},{"site":"Maden dam (MD)","lat":-32.4424,"lon":27.1757,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":1,"cats":["Pesticides"]},{"site":"Lourens River","lat":-34.0625133446599,"lon":18.9042286792734,"province":"Western Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":6,"cats":["Pesticides"]},{"site":"Makatini Flats","lat":-27.40374,"lon":32.02754,"province":"KwaZulu-Natal","wbt":"Marine/Coastal","n_cats":1,"n_contaminants":2,"cats":["Pesticides"]},{"site":"uMngeni River","lat":-29.551035,"lon":30.547268,"province":"KwaZulu-Natal","wbt":"WWTP","n_cats":1,"n_contaminants":2,"cats":["Pesticides"]},{"site":"Diep River","lat":-33.8592,"lon":18.499,"province":"Western Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":16,"cats":["Polycyclic Aromatic Hydrocarbons"]},{"site":"Buffalo River Estuary","lat":-33.0305,"lon":27.85821,"province":"Eastern Cape","wbt":"Surface Water","n_cats":1,"n_contaminants":16,"cats":["Polycyclic Aromatic Hydrocarbons"]},{"site":"Blood River","lat":-28.0051,"lon":30.5816,"province":"KwaZulu-Natal","wbt":"Unclassified","n_cats":1,"n_contaminants":16,"cats":["Polycyclic Aromatic Hydrocarbons"]},{"site":"Mokolo River","lat":-23.7025,"lon":27.7392,"province":"Limpopo","wbt":"Unclassified","n_cats":1,"n_contaminants":16,"cats":["Polycyclic Aromatic Hydrocarbons"]},{"site":"DEWATS","lat":-29.8782,"lon":30.9865,"province":"KwaZulu-Natal","wbt":"WWTP","n_cats":1,"n_contaminants":13,"cats":["Antiretrovirals (ARVs)"]},{"site":"Northern WWTP","lat":-29.7948,"lon":30.9789,"province":"KwaZulu-Natal","wbt":"WWTP","n_cats":1,"n_contaminants":13,"cats":["Antiretrovirals (ARVs)"]},{"site":"Phoenix WWTP","lat":-29.7167,"lon":30.9833,"province":"KwaZulu-Natal","wbt":"WWTP","n_cats":1,"n_contaminants":13,"cats":["Antiretrovirals (ARVs)"]}],"cooc":{"Carbamazepine":{"Carbamazepine":0,"Ibuprofen":2,"Nevirapine":7,"Efavirenz":7,"Fragments":0,"Films":0,"Sulfamethoxazole":13,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":16,"Diclofenac":1,"Naproxen":1,"Ketoprofen":1,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":11,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Ibuprofen":{"Carbamazepine":2,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":1,"Acetylsalicylic acid":8,"Fibres":0,"Clarithromycin":1,"Diclofenac":4,"Naproxen":4,"Ketoprofen":9,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":8,"Nalidixic Acid":8,"Lopinavir":0,"Triclosan":0},"Nevirapine":{"Carbamazepine":7,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":17,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":10,"Triclosan":0},"Efavirenz":{"Carbamazepine":7,"Ibuprofen":0,"Nevirapine":17,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":10,"Triclosan":0},"Fragments":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":14,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":12,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":9,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Films":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":14,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":12,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":9,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Sulfamethoxazole":{"Carbamazepine":13,"Ibuprofen":1,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":1,"Fibres":0,"Clarithromycin":12,"Diclofenac":1,"Naproxen":1,"Ketoprofen":1,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":10,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Acetylsalicylic acid":{"Carbamazepine":0,"Ibuprofen":8,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":1,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":8,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":8,"Nalidixic Acid":8,"Lopinavir":0,"Triclosan":0},"Fibres":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":12,"Films":12,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":7,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Clarithromycin":{"Carbamazepine":16,"Ibuprofen":1,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":12,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":1,"Naproxen":1,"Ketoprofen":1,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":11,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Diclofenac":{"Carbamazepine":1,"Ibuprofen":4,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":1,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":1,"Diclofenac":0,"Naproxen":7,"Ketoprofen":1,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Naproxen":{"Carbamazepine":1,"Ibuprofen":4,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":1,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":1,"Diclofenac":7,"Naproxen":0,"Ketoprofen":1,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Ketoprofen":{"Carbamazepine":1,"Ibuprofen":9,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":1,"Acetylsalicylic acid":8,"Fibres":0,"Clarithromycin":1,"Diclofenac":1,"Naproxen":1,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":8,"Nalidixic Acid":8,"Lopinavir":0,"Triclosan":0},"Polybrominated diphenyl ethers":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Polystyrene":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":9,"Films":9,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":7,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Erythromycin":{"Carbamazepine":11,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":10,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":11,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Ampicillin":{"Carbamazepine":0,"Ibuprofen":8,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":8,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":8,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":8,"Lopinavir":0,"Triclosan":0},"Nalidixic Acid":{"Carbamazepine":0,"Ibuprofen":8,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":8,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":8,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":8,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Lopinavir":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":10,"Efavirenz":10,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0},"Triclosan":{"Carbamazepine":0,"Ibuprofen":0,"Nevirapine":0,"Efavirenz":0,"Fragments":0,"Films":0,"Sulfamethoxazole":0,"Acetylsalicylic acid":0,"Fibres":0,"Clarithromycin":0,"Diclofenac":0,"Naproxen":0,"Ketoprofen":0,"Polybrominated diphenyl ethers":0,"Polystyrene":0,"Erythromycin":0,"Ampicillin":0,"Nalidixic Acid":0,"Lopinavir":0,"Triclosan":0}},"top_names":["Carbamazepine","Ibuprofen","Nevirapine","Efavirenz","Fragments","Films","Sulfamethoxazole","Acetylsalicylic acid","Fibres","Clarithromycin","Diclofenac","Naproxen","Ketoprofen","Polybrominated diphenyl ethers","Polystyrene","Erythromycin","Ampicillin","Nalidixic Acid","Lopinavir","Triclosan"],"wwtp_removal":[{"site":"Phoenix WWTP","name":"Maraviroc","influent":82.0,"effluent":39.0,"removal":52.4},{"site":"DEWATS","name":"Zidovudine","influent":53000.0,"effluent":500.0,"removal":99.1},{"site":"Northern WWTP","name":"Zidovudine","influent":6900.0,"effluent":87.0,"removal":98.7},{"site":"Phoenix WWTP","name":"Zidovudine","influent":11000.0,"effluent":430.0,"removal":96.1},{"site":"DEWATS","name":"Nevirapine","influent":2100.0,"effluent":1900.0,"removal":9.5},{"site":"Northern WWTP","name":"Nevirapine","influent":670.0,"effluent":540.0,"removal":19.4},{"site":"Phoenix WWTP","name":"Nevirapine","influent":2800.0,"effluent":1400.0,"removal":50.0},{"site":"DEWATS","name":"Raltegravir","influent":17000.0,"effluent":3500.0,"removal":79.4},{"site":"Northern WWTP","name":"Raltegravir","influent":810.0,"effluent":86.0,"removal":89.4},{"site":"DEWATS","name":"Darunavir","influent":43000.0,"effluent":17000.0,"removal":60.5},{"site":"Northern WWTP","name":"Darunavir","influent":920.0,"effluent":350.0,"removal":62.0},{"site":"Phoenix WWTP","name":"Darunavir","influent":69.0,"effluent":130.0,"removal":-88.4},{"site":"DEWATS","name":"Atazanavir","influent":64.0,"effluent":78.0,"removal":-21.9},{"site":"Northern WWTP","name":"Atazanavir","influent":1400.0,"effluent":740.0,"removal":47.1},{"site":"Phoenix WWTP","name":"Atazanavir","influent":210.0,"effluent":300.0,"removal":-42.9},{"site":"DEWATS","name":"Indinavir","influent":260.0,"effluent":25.0,"removal":90.4},{"site":"Northern WWTP","name":"Indinavir","influent":590.0,"effluent":42.0,"removal":92.9},{"site":"Phoenix WWTP","name":"Indinavir","influent":300.0,"effluent":40.0,"removal":86.7},{"site":"DEWATS","name":"Ritonavir","influent":3200.0,"effluent":1500.0,"removal":53.1},{"site":"Northern WWTP","name":"Ritonavir","influent":1600.0,"effluent":910.0,"removal":43.1},{"site":"Phoenix WWTP","name":"Ritonavir","influent":1600.0,"effluent":460.0,"removal":71.2},{"site":"DEWATS","name":"Lopinavir","influent":2500.0,"effluent":3800.0,"removal":-52.0},{"site":"Northern WWTP","name":"Lopinavir","influent":1300.0,"effluent":3800.0,"removal":-192.3},{"site":"Phoenix WWTP","name":"Lopinavir","influent":1200.0,"effluent":1900.0,"removal":-58.3},{"site":"DEWATS","name":"Lamivudine","influent":2200.0,"effluent":130.0,"removal":94.1},{"site":"DEWATS","name":"Efavirenz","influent":34000.0,"effluent":34000.0,"removal":0.0},{"site":"Northern WWTP","name":"Efavirenz","influent":24000.0,"effluent":33000.0,"removal":-37.5},{"site":"Phoenix WWTP","name":"Efavirenz","influent":34000.0,"effluent":20000.0,"removal":41.2}],"temporal":{"2004":{"Pesticides":2},"2006":{"Pesticides":1},"2013":{"Microbial CECs":4},"2014":{"Microbial CECs":5},"2015":{"Microbial CECs":2,"Microplastics":31},"2016":{"Microbial CECs":2,"Microplastics":8},"2017":{"Heavy Metals":2,"Pharmaceuticals & PPCPs":80,"Pesticides":1},"2018":{"Pharmaceuticals & PPCPs":42,"Pesticides":2,"Antiretrovirals (ARVs)":78},"2019":{"Microbial CECs":2,"Microplastics":44,"Nanomaterials":5,"Pesticides":5,"Polycyclic Aromatic Hydrocarbons":5},"2020":{"Microbial CECs":3,"Microplastics":6,"Polycyclic Aromatic Hydrocarbons":16},"2021":{"Pharmaceuticals & PPCPs":34},"2022":{"Polycyclic Aromatic Hydrocarbons":32}},"years":[2004,2006,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],"wbt_cat":{"Alkylphenols & APEOs":{"Unclassified":7,"Surface Water":22,"WWTP":11},"Heavy Metals":{"Unclassified":22,"WWTP":5,"Surface Water":6,"Groundwater":2,"Agricultural Water":2,"Sediment":5},"Microbial CECs":{"Groundwater":6,"Unclassified":12,"Surface Water":7,"WWTP":2},"Microplastics":{"Surface Water":9,"Unclassified":43,"Marine/Coastal":56},"Nanomaterials":{"Surface Water":5},"Pharmaceuticals & PPCPs":{"Surface Water":71,"Unclassified":117,"Sediment":60,"WWTP":133},"Pesticides":{"Surface Water":21,"WWTP":6,"Marine/Coastal":7,"Unclassified":16,"Sediment":1},"Polycyclic Aromatic Hydrocarbons":{"Surface Water":53,"Unclassified":32},"Antiretrovirals (ARVs)":{"WWTP":78}},"prov_totals":{"North West":30,"Gauteng":90,"Mpumalanga":26,"Eastern Cape":201,"Free State":8,"Western Cape":35,"KwaZulu-Natal":253,"Limpopo":16},"top_conc":[{"name":"Carbamazepine","cat":"Pharmaceuticals & PPCPs","n":27,"min":1.65,"max":36576.2,"median":279.5,"p75":5194.4,"unit":"ng/L"},{"name":"Ibuprofen","cat":"Pharmaceuticals & PPCPs","n":25,"min":4.76,"max":689.0,"median":42.0,"p75":153.3,"unit":"ng/L"},{"name":"Nevirapine","cat":"Pharmaceuticals & PPCPs","n":20,"min":1.0,"max":2800.0,"median":50.0,"p75":572.5,"unit":"ng/L"},{"name":"Efavirenz","cat":"Pharmaceuticals & PPCPs","n":20,"min":2.0,"max":34000.0,"median":77.5,"p75":21000.0,"unit":"ng/L"},{"name":"Fragments","cat":"Microplastics","n":19,"min":7.0,"max":73.0,"median":31.0,"p75":56.0,"unit":"particles/100m²"},{"name":"Sulfamethoxazole","cat":"Pharmaceuticals & PPCPs","n":19,"min":0.09,"max":6968.0,"median":1979.8,"p75":4804.1,"unit":"ng/L"},{"name":"Fibres","cat":"Microplastics","n":18,"min":2.0,"max":98.0,"median":21.0,"p75":44.0,"unit":"particles/100m²"},{"name":"Clarithromycin","cat":"Pharmaceuticals & PPCPs","n":17,"min":4.8,"max":3280.4,"median":144.0,"p75":315.0,"unit":"ng/L"},{"name":"Diclofenac","cat":"Pharmaceuticals & PPCPs","n":17,"min":7.0,"max":1461.5,"median":64.0,"p75":164.0,"unit":"ng/L"},{"name":"Erythromycin","cat":"Pharmaceuticals & PPCPs","n":13,"min":0.26,"max":118000.9,"median":83.6,"p75":263.0,"unit":"ng/L"}],"provinces":["KwaZulu-Natal","Eastern Cape","Gauteng","Western Cape","North West","Free State","Mpumalanga","Limpopo","Northern Cape"],"cats":["Pharmaceuticals & PPCPs","Microplastics","Polycyclic Aromatic Hydrocarbons","Antiretrovirals (ARVs)","Pesticides","Heavy Metals","Alkylphenols & APEOs","Microbial CECs","Nanomaterials"],"wbt_types":["WWTP","Surface Water","Sediment","Marine/Coastal","Groundwater","Sewage Sludge","Agricultural Water","Unclassified"]};

const CAT_COLORS = {
  "Pharmaceuticals & PPCPs": "#2563EB",
  "Microplastics": "#7C3AED",
  "Polycyclic Aromatic Hydrocarbons": "#DC2626",
  "Antiretrovirals (ARVs)": "#059669",
  "Pesticides": "#D97706",
  "Heavy Metals": "#6B7280",
  "Alkylphenols & APEOs": "#DB2777",
  "Microbial CECs": "#0891B2",
  "Nanomaterials": "#65A30D"
};
const WBT_COLORS = {"WWTP":"#3B82F6","Surface Water":"#06B6D4","Sediment":"#92400E","Marine/Coastal":"#0E7490","Groundwater":"#4ADE80","Sewage Sludge":"#6B7280","Agricultural Water":"#84CC16","Unclassified":"#D1D5DB"};
const PROV_COLORS = {"KwaZulu-Natal":"#1D4ED8","Eastern Cape":"#7C3AED","Gauteng":"#B45309","Western Cape":"#0F766E","North West":"#C026D3","Free State":"#0369A1","Mpumalanga":"#15803D","Limpopo":"#DC2626","Northern Cape":"#9CA3AF"};

const TABS = ["Overview","Map","Co-occurrence","Gap Matrix","WWTP Removal","Temporal","Concentrations","Source Fingerprint"];

const MAP_W = 700, MAP_H = 520;
const projLon = (lon) => ((lon - 16.5) / (33 - 16.5)) * MAP_W;
const projLat = (lat) => ((lat - (-35)) / ((-21) - (-35))) * MAP_H;

const PROV_PATHS = {
  "Western Cape": "M 140,440 L 180,420 L 200,430 L 220,450 L 195,490 L 160,490 L 130,470 Z",
  "Eastern Cape": "M 200,340 L 290,320 L 360,330 L 390,360 L 390,420 L 340,440 L 260,450 L 220,450 L 200,430 L 180,420 L 190,390 Z",
  "Northern Cape": "M 100,240 L 220,200 L 320,210 L 360,250 L 360,330 L 290,320 L 200,340 L 180,340 L 130,320 L 90,290 Z",
  "Free State": "M 290,240 L 380,240 L 420,260 L 430,300 L 410,330 L 360,330 L 320,210 L 290,240 Z",
  "North West": "M 220,200 L 320,170 L 380,190 L 400,220 L 380,240 L 290,240 L 260,220 Z",
  "Gauteng": "M 360,210 L 410,200 L 430,225 L 420,250 L 390,255 L 370,235 Z",
  "Limpopo": "M 290,120 L 430,110 L 500,150 L 490,200 L 430,210 L 370,200 L 320,170 L 290,140 Z",
  "Mpumalanga": "M 430,140 L 520,130 L 540,180 L 510,220 L 460,230 L 430,210 L 430,140 Z",
  "KwaZulu-Natal": "M 430,260 L 500,260 L 560,310 L 540,390 L 490,420 L 430,410 L 400,370 L 410,320 Z"
};

const s = {
  container: { fontFamily:"inherit", background:"#F8FAFC", minHeight:"100%", color:"#1E293B", padding:"0" },
  header: { background:"linear-gradient(135deg, #0D2B5E 0%, #1B3A6B 60%, #0D2B5E 100%)", borderBottom:"3px solid #2563EB", padding:"24px 28px 0" },
  title: { fontSize:"1.4rem", fontWeight:"700", color:"#FFFFFF", letterSpacing:"0.03em", marginBottom:"4px" },
  subtitle: { fontSize:"0.68rem", color:"#93C5FD", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"20px" },
  statsRow: { display:"flex", gap:"32px", marginBottom:"20px", flexWrap:"wrap" },
  stat: { textAlign:"center" },
  statVal: { fontSize:"1.8rem", fontWeight:"700", color:"#FFFFFF", lineHeight:1 },
  statLbl: { fontSize:"0.6rem", color:"#93C5FD", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"2px" },
  tabs: { display:"flex", gap:"0", borderBottom:"none", overflowX:"auto" },
  tabBtn: (active) => ({ padding:"10px 16px", fontSize:"0.68rem", letterSpacing:"0.06em", textTransform:"uppercase", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:"600", borderBottom: active ? "3px solid #FFFFFF" : "3px solid transparent", background:"transparent", color: active ? "#FFFFFF" : "#93C5FD", transition:"all 0.15s", whiteSpace:"nowrap" }),
  body: { padding:"24px 28px", background:"#F8FAFC" },
  card: { background:"#FFFFFF", border:"1px solid #E2E8F0", borderRadius:"8px", padding:"20px", marginBottom:"20px", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize:"0.72rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"#2563EB", marginBottom:"16px", borderBottom:"2px solid #DBEAFE", paddingBottom:"8px", fontWeight:"700" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" },
  badge: (col) => ({ display:"inline-block", padding:"2px 8px", borderRadius:"3px", fontSize:"0.6rem", background:col+"18", color:col, border:`1px solid ${col}44`, letterSpacing:"0.05em" }),
  insight: { background:"#EFF6FF", border:"1px solid #BFDBFE", borderLeft:"4px solid #2563EB", borderRadius:"6px", padding:"12px 16px", fontSize:"0.72rem", color:"#1E3A6E", lineHeight:1.7, marginTop:"12px" },
  mapContainer: { position:"relative", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:"8px", overflow:"hidden" },
  siteTooltip: { position:"fixed", background:"#FFFFFF", border:"1px solid #2563EB", borderRadius:"6px", padding:"10px 14px", fontSize:"0.68rem", pointerEvents:"none", zIndex:1000, maxWidth:"220px", color:"#1E293B", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:"6px",padding:"10px 14px",fontSize:"0.7rem",color:"#1E293B",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
      <div style={{color:"#2563EB",marginBottom:"6px",fontWeight:"700"}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color,marginBottom:"2px"}}>{p.name}: <strong>{p.value?.toLocaleString?.() ?? p.value}</strong></div>
      ))}
    </div>
  );
};

export default function ARCWRCKnowledgeHub() {
  const [tab, setTab] = useState("Overview");
  const [hoveredSite, setHoveredSite] = useState(null);
  const [hoveredProv, setHoveredProv] = useState(null);
  const [selectedWWTP, setSelectedWWTP] = useState("All");
  const [tooltip, setTooltip] = useState(null);

  const catData = Object.entries(D.cat_counts).map(([name, value]) => ({ name: name.replace("Polycyclic Aromatic Hydrocarbons","PAHs"), full: name, value }));
  const provData = Object.entries(D.prov_totals).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));
  const wbtData = Object.entries(
    Object.values(D.wbt_cat).reduce((acc, obj) => { Object.entries(obj).forEach(([k,v]) => { acc[k] = (acc[k]||0)+v; }); return acc; }, {})
  ).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));

  const temporalData = D.years.map(yr => {
    const row = { year: String(yr) };
    D.cats.forEach(c => { row[c] = (D.temporal[String(yr)] || {})[c] || 0; });
    return row;
  });

  const maxGap = Math.max(...D.provinces.flatMap(p => D.cats.map(c => D.prov_cat[p]?.[c]||0)));
  const wwtpSites = [...new Set(D.wwtp_removal.map(r=>r.site))];
  const filteredWWTP = selectedWWTP === "All" ? D.wwtp_removal : D.wwtp_removal.filter(r=>r.site===selectedWWTP);

  const shortCats = D.cats.map(c => {
    const map = {"Pharmaceuticals & PPCPs":"PPCPs","Microplastics":"Microplastics","Polycyclic Aromatic Hydrocarbons":"PAHs","Antiretrovirals (ARVs)":"ARVs","Pesticides":"Pesticides","Heavy Metals":"Hvy Metals","Alkylphenols & APEOs":"APEOs","Microbial CECs":"Microbial","Nanomaterials":"Nanomtls"};
    return {full:c, short:map[c]||c};
  });

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.title}>ARC-WRC · CEC INTELLIGENCE PLATFORM</div>
        <div style={s.subtitle}>South Africa Contaminants of Emerging Concern · Knowledge Hub Master Dataset</div>
        <div style={s.statsRow}>
          {[["817","Total Records"],["167","Unique Contaminants"],["139","Sampling Sites"],["9","CEC Categories"],["9","Provinces"],["2004–2022","Study Period"]].map(([v,l])=>(
            <div key={l} style={s.stat}><div style={s.statVal}>{v}</div><div style={s.statLbl}>{l}</div></div>
          ))}
        </div>
        <div style={s.tabs}>
          {TABS.map(t=>(
            <button key={t} style={s.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {/* OVERVIEW */}
        {tab === "Overview" && (
          <>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardTitle}>Records by CEC Category</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={catData} layout="vertical" margin={{left:10,right:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{fill:"#64748B",fontSize:10}} />
                    <YAxis type="category" dataKey="name" tick={{fill:"#475569",fontSize:9}} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>{catData.map((e)=><Cell key={e.full} fill={CAT_COLORS[e.full]||"#38BDF8"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>Records by Province</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={provData} layout="vertical" margin={{left:10,right:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" tick={{fill:"#64748B",fontSize:10}} />
                    <YAxis type="category" dataKey="name" tick={{fill:"#475569",fontSize:9}} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0,3,3,0]}>{provData.map((e)=><Cell key={e.name} fill={PROV_COLORS[e.name]||"#38BDF8"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardTitle}>Distribution by Water Body Type</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={wbtData} margin={{left:10,right:20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fill:"#475569",fontSize:8}} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{fill:"#64748B",fontSize:10}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[3,3,0,0]}>{wbtData.map((e)=><Cell key={e.name} fill={WBT_COLORS[e.name]||"#38BDF8"} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>Key Insights</div>
                {["KwaZulu-Natal dominates (253 records, 31%) driven by ARV and microplastic estuarine studies — reflects eThekwini's high wastewater load.","Northern Cape has ZERO records across all categories — monitoring void, not clean water.","PPCPs account for 47% of all records, reflecting intensive antibiotic and pharmaceutical research focus.","WWTP (235) and Surface Water (194) are the most monitored environments; Marine/Coastal (63) is underrepresented.","Efavirenz at 34,000 ng/L in WWTP influent is the highest detected ARV — DEWATS shows 0% removal efficiency for this compound.","Co-occurrence of Clarithromycin + Carbamazepine at 16 shared sites signals strong multi-drug river contamination clusters."].map((t,i)=>(
                  <div key={i} style={{...s.insight, marginTop: i===0?"0":"8px"}}>▸ {t}</div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MAP */}
        {tab === "Map" && (
          <div style={s.card}>
            <div style={s.cardTitle}>Spatial Hotspot Map — South Africa (139 georeferenced sites)</div>
            <div style={{display:"flex",gap:"20px",flexWrap:"wrap"}}>
              <div style={{...s.mapContainer, flex:"1 1 600px"}}>
                <svg width={MAP_W} height={MAP_H} style={{display:"block"}}>
                  {Object.entries(PROV_PATHS).map(([prov, path]) => {
                    const total = D.prov_totals[prov] || 0;
                    const opacity = total > 0 ? 0.15 + (total/253)*0.5 : 0.05;
                    return <path key={prov} d={path} fill={PROV_COLORS[prov]||"#CBD5E1"} fillOpacity={opacity} stroke={hoveredProv===prov?"#2563EB":"#94A3B8"} strokeWidth={hoveredProv===prov?1.5:0.8} style={{cursor:"pointer"}} onMouseEnter={()=>setHoveredProv(prov)} onMouseLeave={()=>setHoveredProv(null)} />;
                  })}
                  {[["Western Cape",165,465],["Eastern Cape",285,385],["Northern Cape",205,275],["Free State",370,290],["North West",305,215],["Gauteng",395,230],["Limpopo",390,155],["Mpumalanga",475,185],["KwaZulu-Natal",470,330]].map(([name,x,y])=>(
                    <text key={name} x={x} y={y} textAnchor="middle" fill="#334155" fontSize="8">{name}</text>
                  ))}
                  {D.sites.map((site, i) => {
                    const x = projLon(site.lon);
                    const y = MAP_H - projLat(site.lat);
                    const r = 3 + site.n_contaminants * 0.4;
                    const col = CAT_COLORS[site.cats[0]] || "#38BDF8";
                    const isHot = site.n_cats >= 2 || site.n_contaminants >= 8;
                    return (
                      <g key={i}>
                        {isHot && <circle cx={x} cy={y} r={r+4} fill={col} fillOpacity={0.15} />}
                        <circle cx={x} cy={y} r={r} fill={col} fillOpacity={0.9} stroke={hoveredSite?.site===site.site?"#1E293B":col} strokeWidth={hoveredSite?.site===site.site?1.5:0.5} style={{cursor:"pointer"}} onMouseEnter={(e)=>{ setHoveredSite(site); setTooltip({x:e.clientX,y:e.clientY}); }} onMouseLeave={()=>{ setHoveredSite(null); setTooltip(null); }} />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div style={{flex:"0 0 180px"}}>
                <div style={{fontSize:"0.62rem",color:"#64748B",letterSpacing:"0.1em",marginBottom:"10px",textTransform:"uppercase",fontWeight:"600"}}>CEC Category</div>
                {D.cats.map(c=>(
                  <div key={c} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <div style={{width:"10px",height:"10px",borderRadius:"50%",background:CAT_COLORS[c],flexShrink:0}} />
                    <span style={{fontSize:"0.65rem",color:"#475569"}}>{c.replace("Polycyclic Aromatic Hydrocarbons","PAHs").replace("Pharmaceuticals & PPCPs","PPCPs")}</span>
                  </div>
                ))}
                <div style={{marginTop:"16px",fontSize:"0.62rem",color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:"600"}}>Dot Size</div>
                <div style={{fontSize:"0.65rem",color:"#64748B",marginTop:"6px",lineHeight:1.6}}>Proportional to number of contaminants detected at site. Glowing = multi-category hotspot.</div>
              </div>
            </div>
            {hoveredSite && tooltip && (
              <div style={{...s.siteTooltip, left:tooltip.x+12, top:tooltip.y-20}}>
                <div style={{color:"#2563EB",fontWeight:"700",marginBottom:"4px"}}>{hoveredSite.site.slice(0,40)}</div>
                <div>Province: <span style={{color:"#1E293B",fontWeight:"600"}}>{hoveredSite.province}</span></div>
                <div>Type: <span style={{color:"#1E293B",fontWeight:"600"}}>{hoveredSite.wbt}</span></div>
                <div>Contaminants: <span style={{color:"#DC2626",fontWeight:"700"}}>{hoveredSite.n_contaminants}</span></div>
                <div>Categories: <span style={{color:"#D97706",fontWeight:"700"}}>{hoveredSite.n_cats}</span></div>
                <div style={{marginTop:"4px",fontSize:"0.62rem",color:"#64748B"}}>{hoveredSite.cats.join(", ")}</div>
              </div>
            )}
          </div>
        )}

        {/* CO-OCCURRENCE */}
        {tab === "Co-occurrence" && (
          <div style={s.card}>
            <div style={s.cardTitle}>Contaminant Co-occurrence Heatmap — Top 20 Compounds (shared site frequency)</div>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",fontSize:"0.6rem",width:"100%"}}>
                <thead>
                  <tr>
                    <td style={{padding:"4px",color:"#475569",fontSize:"0.55rem"}}>↓ Row with →</td>
                    {D.top_names.map(n=>(
                      <th key={n} style={{padding:"2px 4px",color:"#94A3B8",fontWeight:"500",writingMode:"vertical-lr",transform:"rotate(180deg)",height:"90px",verticalAlign:"bottom",fontSize:"0.58rem"}}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {D.top_names.map(row=>{
                    const maxVal = Math.max(...D.top_names.map(col=>D.cooc[row]?.[col]||0));
                    return (
                      <tr key={row}>
                        <td style={{padding:"2px 8px 2px 4px",color:"#94A3B8",whiteSpace:"nowrap",fontSize:"0.6rem",fontWeight:"500"}}>{row}</td>
                        {D.top_names.map(col=>{
                          const v = D.cooc[row]?.[col]||0;
                          if (row===col) return <td key={col} style={{background:"#1E293B",width:"22px",height:"22px"}} />;
                          const intensity = maxVal > 0 ? v/maxVal : 0;
                          const bg = v===0 ? "#0A0E1A" : `rgba(56,189,248,${0.1+intensity*0.85})`;
                          return <td key={col} style={{background:bg,width:"22px",height:"22px",textAlign:"center",color:v>0?"#E2E8F0":"#1E293B",fontSize:"0.55rem",border:"1px solid #0A0E1A",cursor:"default"}} title={`${row} + ${col}: ${v} shared sites`}>{v>0?v:""}</td>;
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={s.insight}>▸ <strong>Clarithromycin + Carbamazepine (16 co-occurrences)</strong> is the strongest pairing. ▸ <strong>Nevirapine + Efavirenz (17)</strong> signals ARV co-detection. ▸ <strong>Microplastic cluster</strong> (Fragments–Films–Fibres–Polystyrene) forms a distinct estuarine multi-polymer signature.</div>
          </div>
        )}

        {/* GAP MATRIX */}
        {tab === "Gap Matrix" && (
          <div style={s.card}>
            <div style={s.cardTitle}>Research Gap Matrix — Province × CEC Category</div>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%",fontSize:"0.65rem"}}>
                <thead>
                  <tr>
                    <th style={{padding:"8px 12px",color:"#64748B",textAlign:"left",fontWeight:"500",borderBottom:"1px solid #1E293B"}}>Province</th>
                    {D.cats.map(c=>(
                      <th key={c} style={{padding:"6px 8px",color:"#94A3B8",fontWeight:"500",textAlign:"center",borderBottom:"1px solid #1E293B",fontSize:"0.58rem",writingMode:"vertical-lr",transform:"rotate(180deg)",height:"80px",verticalAlign:"bottom"}}>
                        {c.replace("Polycyclic Aromatic Hydrocarbons","PAHs").replace("Pharmaceuticals & PPCPs","PPCPs")}
                      </th>
                    ))}
                    <th style={{padding:"6px 8px",color:"#38BDF8",fontWeight:"700",textAlign:"center",borderBottom:"1px solid #1E293B"}}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {D.provinces.map((prov,ri)=>{
                    const rowTotal = D.cats.reduce((sum,c)=>sum+(D.prov_cat[prov]?.[c]||0),0);
                    return (
                      <tr key={prov} style={{background:ri%2===0?"#0F172A":"#080D18"}}>
                        <td style={{padding:"8px 12px",color:PROV_COLORS[prov]||"#E2E8F0",fontWeight:"600",whiteSpace:"nowrap",borderRight:"1px solid #1E293B"}}>{prov}</td>
                        {D.cats.map(c=>{
                          const v = D.prov_cat[prov]?.[c]||0;
                          const intensity = maxGap>0?v/maxGap:0;
                          const bg = v===0 ? "#2D0A0A" : `rgba(16,185,129,${0.08+intensity*0.7})`;
                          const color = v===0 ? "#7F1D1D" : intensity>0.4?"#ECFDF5":"#6EE7B7";
                          return <td key={c} style={{background:bg,textAlign:"center",padding:"8px 4px",color,fontWeight:v>0?"600":"400",border:"1px solid #0A0E1A",minWidth:"42px"}}>{v===0?"—":v}</td>;
                        })}
                        <td style={{textAlign:"center",padding:"8px",fontWeight:"700",color:rowTotal>0?"#38BDF8":"#7F1D1D",background:rowTotal>50?"#0F2744":"#0A0E1A",border:"1px solid #1E293B"}}>{rowTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={s.insight}>▸ <strong>Northern Cape</strong> has zero records across ALL categories. ▸ <strong>Limpopo</strong> has only PAH records. ▸ <strong>Free State</strong> has no PPCPs, Microplastics, or ARV data. ▸ Heavy Metals are the only category with coverage in Mpumalanga.</div>
          </div>
        )}

        {/* WWTP REMOVAL */}
        {tab === "WWTP Removal" && (
          <div style={s.card}>
            <div style={s.cardTitle}>WWTP ARV Removal Efficiency — KwaZulu-Natal (eThekwini)</div>
            <div style={{display:"flex",gap:"10px",marginBottom:"16px",alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:"0.65rem",color:"#64748B"}}>Filter by plant:</span>
              {["All",...wwtpSites].map(site=>(
                <button key={site} onClick={()=>setSelectedWWTP(site)} style={{padding:"4px 12px",fontSize:"0.62rem",background:selectedWWTP===site?"#1E3A5F":"transparent",border:`1px solid ${selectedWWTP===site?"#38BDF8":"#1E293B"}`,color:selectedWWTP===site?"#38BDF8":"#64748B",borderRadius:"4px",cursor:"pointer",fontFamily:"inherit"}}>{site}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={filteredWWTP} margin={{left:10,right:20,bottom:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" tick={{fill:"#94A3B8",fontSize:9}} angle={-35} textAnchor="end" height={70} interval={0} />
                <YAxis tick={{fill:"#64748B",fontSize:10}} tickFormatter={v=>`${v}%`} domain={[-250,100]} />
                <Tooltip content={({active,payload,label})=>{
                  if (!active||!payload?.length) return null;
                  const d=payload[0]?.payload;
                  return <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:"6px",padding:"10px",fontSize:"0.68rem",color:"#E2E8F0"}}>
                    <div style={{color:"#38BDF8",marginBottom:"4px"}}>{label} @ {d?.site}</div>
                    <div>Influent: <strong>{d?.influent?.toLocaleString()} ng/L</strong></div>
                    <div>Effluent: <strong>{d?.effluent?.toLocaleString()} ng/L</strong></div>
                    <div style={{color:d?.removal<0?"#F87171":d?.removal>80?"#34D399":"#FBBF24"}}>Removal: <strong>{d?.removal}%</strong></div>
                  </div>;
                }} />
                <Bar dataKey="removal" radius={[3,3,0,0]}>
                  {filteredWWTP.map((e,i)=><Cell key={i} fill={e.removal<0?"#EF4444":e.removal>80?"#10B981":e.removal>50?"#F59E0B":"#3B82F6"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={s.insight}>▸ <strong>Lopinavir concentration INCREASES</strong> across all three WWTPs (−52% to −192%). ▸ <strong>Efavirenz</strong> shows 0% removal at DEWATS and negative at Northern. ▸ <strong>Zidovudine, Lamivudine, and Indinavir</strong> are effectively removed (&gt;90%) at most plants.</div>
          </div>
        )}

        {/* TEMPORAL */}
        {tab === "Temporal" && (
          <div style={s.card}>
            <div style={s.cardTitle}>Temporal Trends — Records Published by Year and CEC Category</div>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={temporalData} margin={{left:10,right:20,bottom:10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="year" tick={{fill:"#94A3B8",fontSize:11}} />
                <YAxis tick={{fill:"#64748B",fontSize:10}} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize:"0.62rem",paddingTop:"12px"}} formatter={(v)=>v.replace("Polycyclic Aromatic Hydrocarbons","PAHs").replace("Pharmaceuticals & PPCPs","PPCPs")} />
                {D.cats.filter(c=>D.years.some(y=>(D.temporal[String(y)]||{})[c]>0)).map(c=>(
                  <Line key={c} type="monotone" dataKey={c} stroke={CAT_COLORS[c]} strokeWidth={2} dot={{r:3,fill:CAT_COLORS[c]}} activeDot={{r:5}} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div style={s.insight}>▸ <strong>2017–2018</strong> was the peak publication period — PPCPs (80 records) and ARVs (78) drove the surge. ▸ <strong>Microplastics</strong> spiked in 2015 (31) and 2019 (44). ▸ <strong>PAHs</strong> resurged in 2022 (32 records).</div>
          </div>
        )}

        {/* CONCENTRATIONS */}
        {tab === "Concentrations" && (
          <div style={s.card}>
            <div style={s.cardTitle}>Concentration Distribution — Top Detected Compounds</div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={D.top_conc.slice(0,15)} layout="vertical" margin={{left:20,right:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis type="number" scale="log" domain={[0.01,'auto']} tick={{fill:"#64748B",fontSize:9}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                <YAxis type="category" dataKey="name" tick={{fill:"#94A3B8",fontSize:9}} width={110} />
                <Tooltip content={({active,payload,label})=>{
                  if (!active||!payload?.length) return null;
                  const d=payload[0]?.payload;
                  return <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:"6px",padding:"10px",fontSize:"0.68rem",color:"#E2E8F0"}}>
                    <div style={{color:"#38BDF8",marginBottom:"4px"}}>{label}</div>
                    <div>Median: <strong>{d?.median} {d?.unit}</strong></div>
                    <div>Max: <strong>{d?.max?.toLocaleString()}</strong></div>
                    <div>n = {d?.n}</div>
                  </div>;
                }} />
                <Bar dataKey="median" radius={[0,3,3,0]}>{D.top_conc.slice(0,15).map((e)=><Cell key={e.name} fill={CAT_COLORS[e.cat]||"#38BDF8"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{marginTop:"20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"10px"}}>
              {D.top_conc.slice(0,6).map(c=>(
                <div key={c.name} style={{background:"#060C18",border:`1px solid ${CAT_COLORS[c.cat]||"#1E293B"}44`,borderRadius:"6px",padding:"10px"}}>
                  <div style={{fontSize:"0.68rem",fontWeight:"700",color:CAT_COLORS[c.cat]||"#38BDF8",marginBottom:"4px"}}>{c.name}</div>
                  <div style={{fontSize:"0.6rem",color:"#64748B",marginBottom:"6px"}}>{c.cat.replace("Pharmaceuticals & PPCPs","PPCP")}</div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.65rem",color:"#94A3B8"}}>
                    <span>min: <strong style={{color:"#E2E8F0"}}>{c.min}</strong></span>
                    <span>med: <strong style={{color:"#FBBF24"}}>{c.median}</strong></span>
                    <span>max: <strong style={{color:"#F87171"}}>{c.max?.toLocaleString()}</strong></span>
                  </div>
                  <div style={{fontSize:"0.58rem",color:"#475569",marginTop:"4px"}}>n={c.n} · {c.unit||"mixed units"}</div>
                </div>
              ))}
            </div>
            <div style={s.insight}>▸ <strong>Erythromycin</strong> has the highest max (118,000 ng/L). ▸ <strong>Sulfamethoxazole</strong> median of 1,980 ng/L drives antimicrobial resistance risk. ▸ <strong>Efavirenz</strong> range spans 2–34,000 ng/L.</div>
          </div>
        )}

        {/* SOURCE FINGERPRINT */}
        {tab === "Source Fingerprint" && (
          <>
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.cardTitle}>CEC Profile by Water Body Type</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{borderCollapse:"collapse",width:"100%",fontSize:"0.62rem"}}>
                    <thead>
                      <tr>
                        <th style={{padding:"6px 10px",color:"#64748B",textAlign:"left",borderBottom:"1px solid #1E293B"}}>Water Body</th>
                        {D.cats.map(c=>(
                          <th key={c} style={{padding:"4px 6px",color:"#94A3B8",textAlign:"center",borderBottom:"1px solid #1E293B",fontSize:"0.55rem",writingMode:"vertical-lr",transform:"rotate(180deg)",height:"70px",verticalAlign:"bottom"}}>
                            {shortCats.find(sc=>sc.full===c)?.short||c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {D.wbt_types.map((wbt,ri)=>(
                        <tr key={wbt} style={{background:ri%2===0?"#0F172A":"#080D18"}}>
                          <td style={{padding:"6px 10px",color:WBT_COLORS[wbt]||"#E2E8F0",fontWeight:"600",borderRight:"1px solid #1E293B",whiteSpace:"nowrap"}}>{wbt}</td>
                          {D.cats.map(c=>{
                            const v=(D.wbt_cat[c]||{})[wbt]||0;
                            const maxV=Math.max(...D.cats.map(cc=>(D.wbt_cat[cc]||{})[wbt]||0));
                            const intensity=maxV>0?v/maxV:0;
                            return <td key={c} style={{textAlign:"center",padding:"6px 4px",background:v>0?`rgba(56,189,248,${0.08+intensity*0.7})`:"#0A0E1A",color:v>0?`rgba(240,249,255,${0.4+intensity*0.6})`:"#1E293B",fontWeight:v>0?"600":"400",border:"1px solid #0A0E1A",minWidth:"36px"}}>{v||"—"}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.cardTitle}>Pollution Source Signatures</div>
                {[
                  { source:"WWTP Effluent", color:"#3B82F6", signature:"PPCPs + ARVs + Microbial CECs", detail:"Drug metabolites + enteric pathogens confirm wastewater origin." },
                  { source:"Industrial/Mining", color:"#6B7280", signature:"Heavy Metals + PAHs", detail:"Mpumalanga and Free State co-detections trace coal/mining operations." },
                  { source:"Agricultural Runoff", color:"#D97706", signature:"Pesticides + Alkylphenols", detail:"Vaal River, Lourens River — APEOs from livestock/veterinary products." },
                  { source:"Marine/Estuarine", color:"#0891B2", signature:"Microplastics (Fragments + Films)", detail:"KZN estuaries show PE/PP/PS polymer suite from urban stormwater." },
                  { source:"Urban Stormwater", color:"#DB2777", signature:"APEOs + PPCPs + Pesticides", detail:"Jukskei River (Gauteng) multi-category detection in single urban catchment." },
                ].map(src=>(
                  <div key={src.source} style={{background:"#060C18",border:`1px solid ${src.color}33`,borderRadius:"6px",padding:"12px",marginBottom:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
                      <span style={{fontSize:"0.7rem",fontWeight:"700",color:src.color}}>{src.source}</span>
                      <span style={{...s.badge(src.color)}}>{src.signature}</span>
                    </div>
                    <div style={{fontSize:"0.65rem",color:"#94A3B8",lineHeight:1.5}}>{src.detail}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Priority Risk Sites — Multi-Category Hotspots</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"12px"}}>
                {D.sites.filter(site=>site.n_cats>=2||site.n_contaminants>=8).sort((a,b)=>b.n_contaminants-a.n_contaminants).slice(0,8).map(site=>(
                  <div key={site.site} style={{background:"#060C18",border:"1px solid #1E3A5F",borderRadius:"6px",padding:"12px",borderLeft:"3px solid #F59E0B"}}>
                    <div style={{fontSize:"0.68rem",fontWeight:"700",color:"#FBBF24",marginBottom:"4px"}}>{site.site.slice(0,45)}{site.site.length>45?"…":""}</div>
                    <div style={{fontSize:"0.6rem",color:"#64748B",marginBottom:"8px"}}>{site.province} · {site.wbt}</div>
                    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"6px"}}>
                      <span style={{...s.badge("#38BDF8")}}>{site.n_contaminants} contaminants</span>
                      <span style={{...s.badge("#F59E0B")}}>{site.n_cats} categories</span>
                    </div>
                    <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                      {site.cats.map(c=><span key={c} style={{...s.badge(CAT_COLORS[c]||"#38BDF8"),fontSize:"0.55rem"}}>{c.replace("Pharmaceuticals & PPCPs","PPCPs").replace("Polycyclic Aromatic Hydrocarbons","PAHs")}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{textAlign:"center",padding:"16px",fontSize:"0.58rem",color:"#1E3A5F",borderTop:"1px solid #0F1A2E",letterSpacing:"0.1em"}}>
        ARC-WRC CEC INTELLIGENCE PLATFORM · 817 RECORDS · 9 DATASETS · KNOWLEDGE HUB
      </div>
    </div>
  );
}