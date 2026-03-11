import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";

// ── Embedded RF Models (15 trees × 9 categories) ──────────────────────────────
const RF_MODELS = {"Pharmaceuticals & PPCPs":{"trees":[{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":5.599999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.7049180327868853},"right":{"leaf":true,"prob":0.8108108108108107}}}},"right":{"leaf":false,"feature":1,"threshold":28.96198844909668,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":false,"feature":4,"threshold":52.0,"left":{"leaf":false,"feature":3,"threshold":6.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.5}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":81.0,"left":{"leaf":false,"feature":1,"threshold":30.908811569213867,"left":{"leaf":true,"prob":0.6363636363636364},"right":{"leaf":true,"prob":0.11999999999999998}},"right":{"leaf":false,"feature":1,"threshold":27.897700309753418,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.6521739130434783}}}},"right":{"leaf":false,"feature":0,"threshold":32.597190856933594,"left":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.8571428571428571}},"right":{"leaf":false,"feature":3,"threshold":8.099999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.3333333333333333}}},"right":{"leaf":false,"feature":1,"threshold":22.068467140197754,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":27.422247886657715,"left":{"leaf":true,"prob":0.9375},"right":{"leaf":true,"prob":0.42857142857142855}}}}},{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":false,"feature":3,"threshold":5.599999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":true,"prob":0.6},"right":{"leaf":true,"prob":0.9069767441860465}}},"right":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":true,"prob":0.696},"right":{"leaf":true,"prob":0.2857142857142857}}}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":27.75605010986328,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":30.166159629821777,"left":{"leaf":true,"prob":0.5172413793103448},"right":{"leaf":true,"prob":0.9069767441860465}}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":0,"threshold":25.71092414855957,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":33.81104278564453,"left":{"leaf":false,"feature":1,"threshold":27.01554012298584,"left":{"leaf":true,"prob":0.8947368421052632},"right":{"leaf":true,"prob":0.6749999999999999}},"right":{"leaf":false,"feature":1,"threshold":18.708258628845215,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}}},{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":3,"threshold":6.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.8181818181818181},"right":{"leaf":false,"feature":4,"threshold":78.5,"left":{"leaf":true,"prob":0.744},"right":{"leaf":true,"prob":0.1875}}}},"right":{"leaf":false,"feature":4,"threshold":62.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":1,"threshold":22.515438079833984,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":29.75629997253418,"left":{"leaf":false,"feature":0,"threshold":25.721524238586426,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":4,"threshold":62.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.5604395604395604}}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":0,"threshold":30.166159629821777,"left":{"leaf":true,"prob":0.3},"right":{"leaf":true,"prob":0.7731958762886598}},"right":{"leaf":false,"feature":0,"threshold":32.8743953704834,"left":{"leaf":true,"prob":0.9},"right":{"leaf":true,"prob":1.0}}}}},{"leaf":false,"feature":0,"threshold":25.107199668884277,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":6.049999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":33.825477600097656,"left":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":true,"prob":0.7499999999999999},"right":{"leaf":true,"prob":0.6}},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":3,"threshold":6.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.936911582946777,"left":{"leaf":false,"feature":0,"threshold":32.95004463195801,"left":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.6610169491525424},"right":{"leaf":true,"prob":0.7948717948717948}},"right":{"leaf":false,"feature":4,"threshold":68.0,"left":{"leaf":true,"prob":0.3913043478260869},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":0,"threshold":29.802849769592285,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":true,"prob":0.375},"right":{"leaf":true,"prob":0.0}}}}},{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":26.138270378112793,"left":{"leaf":false,"feature":0,"threshold":33.81087875366211,"left":{"leaf":false,"feature":3,"threshold":5.599999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.6}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":31.041573524475098,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":true,"prob":0.759493670886076},"right":{"leaf":true,"prob":0.6}},"right":{"leaf":true,"prob":0.0}}}}],"n_positive":56},"Microplastics":{"trees":[{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":1.5,"left":{"leaf":false,"feature":1,"threshold":30.88441562652588,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":29.840673446655273,"left":{"leaf":true,"prob":0.9071428571428571},"right":{"leaf":true,"prob":1.0}}},"right":{"leaf":false,"feature":1,"threshold":18.708258628845215,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":1,"threshold":28.96198844909668,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":1.0}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":0,"threshold":29.75759983062744,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.7094972067039107},"right":{"leaf":true,"prob":0.9915419648666233}}},"right":{"leaf":false,"feature":4,"threshold":81.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":1.5,"left":{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":true,"prob":0.8799076212471132},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.7650602409638554},"right":{"leaf":true,"prob":1.0}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":1,"threshold":30.789814949035645,"left":{"leaf":false,"feature":0,"threshold":25.227612495422363,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9482329517172723}},"right":{"leaf":false,"feature":3,"threshold":5.099999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":30.895615577697754,"left":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":true,"prob":1.0},"right":{"leaf":false,"feature":1,"threshold":30.98080062866211,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":31.000173568725586,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":1.0}}}},{"leaf":false,"feature":1,"threshold":30.895615577697754,"left":{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.7650602409638555}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":false,"feature":1,"threshold":31.026549339294434,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.9071428571428571}},"right":{"leaf":true,"prob":0.951310861423221}},"right":{"leaf":false,"feature":0,"threshold":29.837050437927246,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":3,"threshold":6.049999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.6993392070484582}},"right":{"leaf":false,"feature":3,"threshold":5.099999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":0,"threshold":23.003576278686523,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":false,"feature":3,"threshold":3.549999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":30.753260612487793,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9382585751978892}},"right":{"leaf":false,"feature":0,"threshold":29.877699851989746,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":1,"threshold":27.804500579833984,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":30.820011138916016,"left":{"leaf":false,"feature":0,"threshold":22.88666534423828,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":30.965861320495605,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.7094972067039107}},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":true,"prob":0.9750479846449136}}],"n_positive":13},"Polycyclic Aromatic Hydrocarbons":{"trees":[{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":1,"threshold":30.60675048828125,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.7941176470588236},"right":{"leaf":true,"prob":0.4821428571428571}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":false,"feature":0,"threshold":23.371726036071777,"left":{"leaf":false,"feature":1,"threshold":30.036479949951172,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9}},"right":{"leaf":false,"feature":4,"threshold":52.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":0,"threshold":32.982452392578125,"left":{"leaf":false,"feature":1,"threshold":25.876224517822266,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":68.0,"left":{"leaf":false,"feature":1,"threshold":25.645380973815918,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9473684210526316}},"right":{"leaf":false,"feature":0,"threshold":33.957275390625,"left":{"leaf":true,"prob":0.9310344827586208},"right":{"leaf":true,"prob":0.0}}}}},{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":3,"threshold":5.8999998569488525,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.8503937007874016}},"right":{"leaf":false,"feature":3,"threshold":5.8999998569488525,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":false,"feature":0,"threshold":33.85904884338379,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9310344827586208}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":true,"prob":0.9642857142857143},"right":{"leaf":false,"feature":1,"threshold":21.740397453308105,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":0,"threshold":33.81104278564453,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9642857142857143}}},{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":27.75605010986328,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":false,"feature":1,"threshold":25.82196044921875,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9878048780487805}},"right":{"leaf":false,"feature":1,"threshold":26.138270378112793,"left":{"leaf":true,"prob":0.7714285714285715},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.4354838709677419},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":false,"feature":0,"threshold":28.18596076965332,"left":{"leaf":false,"feature":0,"threshold":27.45991611480713,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9310344827586208}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":false,"feature":3,"threshold":5.599999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":32.92893409729004,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.8571428571428572}}},"right":{"leaf":false,"feature":1,"threshold":18.84185028076172,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":3,"threshold":5.450000047683716,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.630499839782715,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":true,"prob":0.801980198019802},"right":{"leaf":true,"prob":0.9}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.0}}}],"n_positive":5},"Antiretrovirals (ARVs)":{"trees":[{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.954050064086914,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9785714285714285}}}},{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":3,"threshold":3.549999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":false,"feature":3,"threshold":5.8999998569488525,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9870317002881844}}},{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":1,"threshold":30.95185089111328,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9891696750902528}},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.95185089111328,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.958041958041958}}}},{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":30.96445083618164,"left":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":2,"threshold":4.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":29.795350074768066,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.9785714285714285}}}},"right":{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":1,"threshold":30.966650009155273,"left":{"leaf":false,"feature":0,"threshold":22.94392681121826,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":2.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9716312056737589}}},{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":3,"threshold":3.549999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":1,"threshold":30.95185089111328,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":1.0}},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":0,"threshold":29.755000114440918,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.96480083465576,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":4.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":1.0}}}},{"leaf":false,"feature":4,"threshold":62.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":30.96480083465576,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":29.800000190734863,"left":{"leaf":true,"prob":0.958041958041958},"right":{"leaf":true,"prob":0.0}}}}],"n_positive":3},"Pesticides":{"trees":[{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":3,"threshold":4.3999998569488525,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.7168141592920354},"right":{"leaf":true,"prob":0.6923076923076923}},"right":{"leaf":false,"feature":1,"threshold":32.0672492980957,"left":{"leaf":true,"prob":0.07964601769911507},"right":{"leaf":true,"prob":0.8709677419354839}}},"right":{"leaf":false,"feature":1,"threshold":28.17344570159912,"left":{"leaf":false,"feature":0,"threshold":25.857625007629395,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.7261613691931541}},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.9101123595505618},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":3,"threshold":9.349999904632568,"left":{"leaf":false,"feature":0,"threshold":26.129581451416016,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":1.5,"left":{"leaf":true,"prob":0.9027355623100304},"right":{"leaf":true,"prob":0.5364238410596026}}},"right":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":1,"threshold":30.585538864135742,"left":{"leaf":true,"prob":0.6694214876033058},"right":{"leaf":true,"prob":0.13846153846153844}},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":3,"threshold":5.8999998569488525,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":4,"threshold":67.5,"left":{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":false,"feature":3,"threshold":4.3999998569488525,"left":{"leaf":true,"prob":0.7714285714285715},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":27.042555809020996,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.5586206896551724}}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":2,"threshold":4.5,"left":{"leaf":false,"feature":0,"threshold":27.002869606018066,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.6923076923076923}},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.627906976744186}}},"right":{"leaf":false,"feature":1,"threshold":27.994790077209473,"left":{"leaf":true,"prob":0.8709677419354839},"right":{"leaf":true,"prob":1.0}}}},{"leaf":false,"feature":1,"threshold":28.378588676452637,"left":{"leaf":false,"feature":0,"threshold":33.57330513000488,"left":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":94.5,"left":{"leaf":true,"prob":0.876923076923077},"right":{"leaf":true,"prob":0.3802816901408452}},"right":{"leaf":false,"feature":3,"threshold":11.149999856948853,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9101123595505618}}},"right":{"leaf":false,"feature":4,"threshold":68.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":34.009525299072266,"left":{"leaf":true,"prob":0.40298507462686567},"right":{"leaf":true,"prob":0.627906976744186}}}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.3476394849785408}},"right":{"leaf":false,"feature":1,"threshold":31.566697120666504,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.627906976744186}}},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":1,"threshold":28.37557601928711,"left":{"leaf":false,"feature":3,"threshold":5.0,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":true,"prob":0.8709677419354839},"right":{"leaf":true,"prob":0.9101123595505618}},"right":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":false,"feature":4,"threshold":94.5,"left":{"leaf":true,"prob":0.801980198019802},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":27.042555809020996,"left":{"leaf":true,"prob":0.3875598086124402},"right":{"leaf":true,"prob":0.8635394456289979}}}},"right":{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":27.59716510772705,"left":{"leaf":true,"prob":0.6923076923076923},"right":{"leaf":false,"feature":0,"threshold":29.577874183654785,"left":{"leaf":true,"prob":0.19424460431654678},"right":{"leaf":true,"prob":0.0}}}}}],"n_positive":32},"Heavy Metals":{"trees":[{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":4,"threshold":43.0,"left":{"leaf":false,"feature":1,"threshold":29.67227554321289,"left":{"leaf":true,"prob":0.75},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.8571428571428572}}},"right":{"leaf":false,"feature":1,"threshold":29.252065658569336,"left":{"leaf":false,"feature":1,"threshold":28.020216941833496,"left":{"leaf":true,"prob":0.3428571428571429},"right":{"leaf":true,"prob":0.8852459016393441}},"right":{"leaf":false,"feature":0,"threshold":29.141799926757812,"left":{"leaf":true,"prob":0.631578947368421},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":4,"threshold":54.5,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":true,"prob":0.896551724137931},"right":{"leaf":false,"feature":3,"threshold":5.8999998569488525,"left":{"leaf":false,"feature":1,"threshold":29.7504243850708,"left":{"leaf":true,"prob":0.9230769230769231},"right":{"leaf":true,"prob":0.9473684210526316}},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.4736842105263158}}}},"right":{"leaf":false,"feature":0,"threshold":26.232632637023926,"left":{"leaf":false,"feature":2,"threshold":2.5,"left":{"leaf":false,"feature":1,"threshold":27.966957092285156,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.6666666666666666}},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":1,"threshold":27.897700309753418,"left":{"leaf":false,"feature":0,"threshold":33.947750091552734,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.6666666666666666}},"right":{"leaf":false,"feature":0,"threshold":27.45991611480713,"left":{"leaf":false,"feature":4,"threshold":52.0,"left":{"leaf":true,"prob":1.0},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.631578947368421},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":0,"threshold":30.533699989318848,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.75}}}},{"leaf":false,"feature":3,"threshold":4.849999904632568,"left":{"leaf":false,"feature":1,"threshold":28.202695846557617,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":4.3999998569488525,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":1.0}}},"right":{"leaf":false,"feature":4,"threshold":78.5,"left":{"leaf":false,"feature":1,"threshold":28.5369873046875,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":30.597599983215332,"left":{"leaf":true,"prob":0.11764705882352942},"right":{"leaf":true,"prob":0.9230769230769231}}},"right":{"leaf":false,"feature":2,"threshold":3.0,"left":{"leaf":false,"feature":1,"threshold":28.070107460021973,"left":{"leaf":true,"prob":0.6428571428571429},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":1,"threshold":27.896072387695312,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":24.741607666015625,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.8571428571428571}},"right":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":false,"feature":1,"threshold":29.39381504058838,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":4,"threshold":81.0,"left":{"leaf":true,"prob":0.13953488372093026},"right":{"leaf":true,"prob":0.4285714285714286}}}}}],"n_positive":20},"Alkylphenols & APEOs":{"trees":[{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":27.994790077209473,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.8838709677419355},"right":{"leaf":true,"prob":0.8130563798219586}},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":false,"feature":1,"threshold":28.96198844909668,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":3,"threshold":3.549999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":0,"threshold":27.63748550415039,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":false,"feature":1,"threshold":29.67227554321289,"left":{"leaf":true,"prob":0.9383561643835616},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":28.58976459503174,"left":{"leaf":true,"prob":0.9945553539019963},"right":{"leaf":true,"prob":0.0}}},"right":{"leaf":true,"prob":0.0}}},{"leaf":false,"feature":4,"threshold":94.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":27.994790077209473,"left":{"leaf":true,"prob":0.958041958041958},"right":{"leaf":true,"prob":0.0}}}},{"leaf":false,"feature":0,"threshold":26.58831024169922,"left":{"leaf":false,"feature":3,"threshold":4.3999998569488525,"left":{"leaf":true,"prob":0.9891696750902528},"right":{"leaf":false,"feature":0,"threshold":26.39459991455078,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9480968858131488}}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":1,"threshold":27.994790077209473,"left":{"leaf":false,"feature":3,"threshold":5.0,"left":{"leaf":false,"feature":1,"threshold":27.104049682617188,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":1.0}},"right":{"leaf":false,"feature":3,"threshold":11.199999809265137,"left":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9891696750902528}}}},"right":{"leaf":false,"feature":6,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}}}],"n_positive":3},"Microbial CECs":{"trees":[{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":0,"threshold":23.345999717712402,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":28.40174961090088,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9818181818181818}}},"right":{"leaf":false,"feature":1,"threshold":30.394450187683105,"left":{"leaf":false,"feature":4,"threshold":81.0,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9310344827586207}},"right":{"leaf":true,"prob":0.9759036144578314}}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":false,"feature":3,"threshold":13.349999904632568,"left":{"leaf":false,"feature":0,"threshold":22.889376640319824,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":28.40174961090088,"left":{"leaf":false,"feature":0,"threshold":25.75755023956299,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9642857142857143}}},"right":{"leaf":false,"feature":1,"threshold":30.394450187683105,"left":{"leaf":false,"feature":4,"threshold":81.0,"left":{"leaf":false,"feature":0,"threshold":25.97778606414795,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":18.708258628845215,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.9642857142857143}}},"right":{"leaf":true,"prob":0.9878048780487805}}},{"leaf":false,"feature":0,"threshold":25.80220317840576,"left":{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":0,"threshold":22.92997646331787,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":1.5,"left":{"leaf":true,"prob":0.9101123595505618},"right":{"leaf":true,"prob":0.870967741935484}}},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":0,"threshold":32.838035583496094,"left":{"leaf":false,"feature":3,"threshold":9.299999952316284,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":0,"threshold":29.46310043334961,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.5294117647058824}}},"right":{"leaf":false,"feature":1,"threshold":18.708258628845215,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.8901098901098902}}}}}],"n_positive":5},"Nanomaterials":{"trees":[{"leaf":false,"feature":5,"threshold":0.5,"left":{"leaf":false,"feature":2,"threshold":3.5,"left":{"leaf":false,"feature":1,"threshold":18.63285255432129,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":0,"threshold":29.064425468444824,"left":{"leaf":false,"feature":1,"threshold":26.342920303344727,"left":{"leaf":true,"prob":1.0},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":1,"threshold":22.06141757965088,"left":{"leaf":true,"prob":0.9642857142857143},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":3,"threshold":4.3999998569488525,"left":{"leaf":false,"feature":0,"threshold":27.414847373962402,"left":{"leaf":true,"prob":0.870967741935484},"right":{"leaf":true,"prob":1.0}},"right":{"leaf":false,"feature":3,"threshold":7.1499998569488525,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":4,"threshold":78.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":0.84375}}}}},{"leaf":false,"feature":1,"threshold":25.720580101013184,"left":{"leaf":false,"feature":0,"threshold":34.009525299072266,"left":{"leaf":false,"feature":0,"threshold":33.15355682373047,"left":{"leaf":true,"prob":0.9310344827586208},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":true,"prob":0.9818181818181818}},"right":{"leaf":true,"prob":0.0}},{"leaf":false,"feature":0,"threshold":34.009525299072266,"left":{"leaf":false,"feature":3,"threshold":3.549999952316284,"left":{"leaf":true,"prob":0.9},"right":{"leaf":true,"prob":0.0}},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":true,"prob":1.0}}},{"leaf":false,"feature":1,"threshold":26.331597328186035,"left":{"leaf":false,"feature":3,"threshold":7.1499998569488525,"left":{"leaf":true,"prob":0.8181818181818182},"right":{"leaf":false,"feature":7,"threshold":0.5,"left":{"leaf":true,"prob":0.0},"right":{"leaf":false,"feature":1,"threshold":18.71530818939209,"left":{"leaf":true,"prob":0.9926470588235294},"right":{"leaf":true,"prob":0.0}}}},"right":{"leaf":true,"prob":0.0}}],"n_positive":5}};

const HI_LOOKUP = {
  prov: {"Eastern Cape":{med:12.64,p75:32.35},"KwaZulu-Natal":{med:0.09,p75:3.08},"Gauteng":{med:0.13,p75:0.59},"Western Cape":{med:0.17,p75:0.25},"North West":{med:0.0,p75:0.0},"Free State":{med:0.0,p75:0.0},"Mpumalanga":{med:0.0,p75:0.0},"Limpopo":{med:0.0,p75:0.0},"Northern Cape":{med:null,p75:null}},
  wbt: {"WWTP":{med:2.8,p75:19.68},"Surface Water":{med:1.25,p75:12.64},"Sediment":{med:1.68,p75:2.26},"Marine/Coastal":{med:0.14,p75:0.14},"Groundwater":{med:0.0,p75:0.0},"Agricultural Water":{med:0.0,p75:0.0},"Unclassified":{med:0.03,p75:0.19}}
};

const ARV_2030 = {
  "Efavirenz":   {"re":1.2,   "pnec":500,   "c2022":125.2, "c2030":149.8, "risk":"HIGH"},
  "Nevirapine":  {"re":26.3,  "pnec":1000,  "c2022":92.3,  "c2030":110.5, "risk":"MODERATE"},
  "Lopinavir":   {"re":-100,  "pnec":1500,  "c2022":49.5,  "c2030":59.2,  "risk":"HIGH"},
  "Zidovudine":  {"re":98.0,  "pnec":20000, "c2022":864.1, "c2030":1039.1,"risk":"LOW"},
  "Lamivudine":  {"re":94.1,  "pnec":50000, "c2022":194.7, "c2030":234.1, "risk":"LOW"},
  "Raltegravir": {"re":84.4,  "pnec":2000,  "c2022":30.0,  "c2030":35.8,  "risk":"LOW"},
};

const ARV_TIMESERIES = [
  {year:2004, Efavirenz:1.6,   Nevirapine:1.2,  Lopinavir:0.6,  Zidovudine:12.3,  Lamivudine:2.8,  Raltegravir:0.4,  proj:false},
  {year:2006, Efavirenz:12.3,  Nevirapine:9.1,  Lopinavir:4.9,  Zidovudine:93.1,  Lamivudine:21.2, Raltegravir:2.9,  proj:false},
  {year:2008, Efavirenz:18.5,  Nevirapine:13.6, Lopinavir:7.3,  Zidovudine:138.6, Lamivudine:31.2, Raltegravir:4.8,  proj:false},
  {year:2010, Efavirenz:34.9,  Nevirapine:25.7, Lopinavir:13.8, Zidovudine:261.4, Lamivudine:58.9, Raltegravir:9.1,  proj:false},
  {year:2012, Efavirenz:53.4,  Nevirapine:39.3, Lopinavir:21.1, Zidovudine:400.2, Lamivudine:90.1, Raltegravir:13.9, proj:false},
  {year:2014, Efavirenz:69.8,  Nevirapine:51.4, Lopinavir:27.6, Zidovudine:523.1, Lamivudine:117.9,Raltegravir:18.2, proj:false},
  {year:2016, Efavirenz:86.2,  Nevirapine:63.5, Lopinavir:34.1, Zidovudine:645.8, Lamivudine:145.5,Raltegravir:22.4, proj:false},
  {year:2018, Efavirenz:106.7, Nevirapine:78.7, Lopinavir:42.2, Zidovudine:799.4, Lamivudine:180.2,Raltegravir:27.8, proj:false},
  {year:2020, Efavirenz:121.1, Nevirapine:89.3, Lopinavir:47.9, Zidovudine:908.2, Lamivudine:204.7,Raltegravir:31.6, proj:false},
  {year:2022, Efavirenz:125.2, Nevirapine:92.3, Lopinavir:49.5, Zidovudine:939.1, Lamivudine:211.6,Raltegravir:32.7, proj:false},
  {year:2024, Efavirenz:134.4, Nevirapine:99.1, Lopinavir:53.1, Zidovudine:1009.0,Lamivudine:227.4,Raltegravir:35.1, proj:true},
  {year:2026, Efavirenz:141.6, Nevirapine:104.4,Lopinavir:56.0, Zidovudine:1063.1,Lamivudine:239.5,Raltegravir:37.0, proj:true},
  {year:2028, Efavirenz:146.7, Nevirapine:108.2,Lopinavir:58.0, Zidovudine:1101.4,Lamivudine:248.2,Raltegravir:38.3, proj:true},
  {year:2030, Efavirenz:149.8, Nevirapine:110.5,Lopinavir:59.2, Zidovudine:1126.4,Lamivudine:253.9,Raltegravir:39.2, proj:true},
  {year:2032, Efavirenz:153.8, Nevirapine:113.4,Lopinavir:60.8, Zidovudine:1156.7,Lamivudine:260.7,Raltegravir:40.3, proj:true},
  {year:2034, Efavirenz:157.1, Nevirapine:115.8,Lopinavir:62.1, Zidovudine:1181.4,Lamivudine:266.3,Raltegravir:41.2, proj:true},
  {year:2036, Efavirenz:159.9, Nevirapine:117.8,Lopinavir:63.2, Zidovudine:1202.4,Lamivudine:271.0,Raltegravir:41.9, proj:true},
  {year:2038, Efavirenz:162.2, Nevirapine:119.5,Lopinavir:64.2, Zidovudine:1220.3,Lamivudine:275.1,Raltegravir:42.5, proj:true},
  {year:2040, Efavirenz:164.1, Nevirapine:120.8,Lopinavir:65.0, Zidovudine:1235.2,Lamivudine:278.4,Raltegravir:43.0, proj:true},
];

const ARV_DRUG_COL = {
  Efavirenz:"#EF4444", Nevirapine:"#3B82F6", Lopinavir:"#F59E0B",
  Zidovudine:"#A855F7", Lamivudine:"#06B6D4", Raltegravir:"#10B981",
};
const ARV_PNEC = {Efavirenz:500, Nevirapine:1000, Lopinavir:1500, Zidovudine:20000, Lamivudine:50000, Raltegravir:2000};

function traverseTree(node, features) {
  if (node.leaf) return node.prob;
  return features[node.feature] <= node.threshold
    ? traverseTree(node.left, features)
    : traverseTree(node.right, features);
}
function rfPredict(model, features) {
  if (!model) return null;
  const avg = model.trees.reduce((s, t) => s + traverseTree(t, features), 0) / model.trees.length;
  return Math.round(avg * 100);
}

const WBT_SCORE = {"WWTP":5,"Surface Water":4,"Sediment":3,"Marine/Coastal":3,"Groundwater":2,"Agricultural Water":2,"Unclassified":1};
const PROV_POP  = {"KwaZulu-Natal":11.5,"Gauteng":15.2,"Eastern Cape":7.1,"Western Cape":7.2,"North West":4.1,"Free State":3.0,"Mpumalanga":4.7,"Limpopo":5.9,"Northern Cape":1.3,"South Africa (unclassified)":5.0};
const PROV_URBAN= {"KwaZulu-Natal":65,"Gauteng":97,"Eastern Cape":44,"Western Cape":92,"North West":44,"Free State":70,"Mpumalanga":42,"Limpopo":13,"Northern Cape":79,"South Africa (unclassified)":60};
const COASTAL_PROVINCES = new Set(["KwaZulu-Natal","Eastern Cape","Western Cape"]);
const PROVINCES = Object.keys(PROV_POP);
const WBTS      = Object.keys(WBT_SCORE);
const CATS      = Object.keys(RF_MODELS);
const CAT_COL   = {"Pharmaceuticals & PPCPs":"#3B82F6","Microplastics":"#7C3AED","Polycyclic Aromatic Hydrocarbons":"#EF4444","Antiretrovirals (ARVs)":"#10B981","Pesticides":"#F59E0B","Heavy Metals":"#6B7280","Alkylphenols & APEOs":"#EC4899","Microbial CECs":"#06B6D4","Nanomaterials":"#84CC16"};
const CAT_SHORT = {"Pharmaceuticals & PPCPs":"PPCPs","Microplastics":"Microplastics","Polycyclic Aromatic Hydrocarbons":"PAHs","Antiretrovirals (ARVs)":"ARVs","Pesticides":"Pesticides","Heavy Metals":"Heavy Metals","Alkylphenols & APEOs":"APEOs","Microbial CECs":"Microbial CECs","Nanomaterials":"Nanomaterials"};

const S = {
  app: {fontFamily:"Arial,sans-serif",background:"#060D1A",minHeight:"100%",color:"#E2E8F0",padding:"0"},
  hdr: {background:"linear-gradient(135deg,#0D1B2A,#1A2744)",borderBottom:"2px solid #1E3A5F",padding:"22px 32px"},
  title:{fontSize:"1.5rem",fontWeight:"700",color:"#60A5FA",letterSpacing:"0.05em"},
  sub:  {fontSize:"0.68rem",color:"#475569",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:"4px"},
  body: {padding:"28px 32px",display:"grid",gridTemplateColumns:"320px 1fr",gap:"28px",alignItems:"start"},
  panel:{background:"#0F172A",border:"1px solid #1E293B",borderRadius:"10px",padding:"20px"},
  ptitle:{fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#3B82F6",marginBottom:"14px",borderBottom:"1px solid #1E293B",paddingBottom:"8px"},
  field:{marginBottom:"16px"},
  label:{fontSize:"0.65rem",color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"5px",display:"block"},
  select:{width:"100%",background:"#060D1A",border:"1px solid #1E3A5F",color:"#E2E8F0",padding:"8px 10px",borderRadius:"6px",fontSize:"0.8rem",fontFamily:"Arial,sans-serif",outline:"none"},
  input:{width:"100%",background:"#060D1A",border:"1px solid #1E3A5F",color:"#E2E8F0",padding:"8px 10px",borderRadius:"6px",fontSize:"0.8rem",fontFamily:"Arial,sans-serif",outline:"none",boxSizing:"border-box"},
  btn:  {width:"100%",padding:"11px",background:"linear-gradient(135deg,#1D4ED8,#2563EB)",color:"white",border:"none",borderRadius:"6px",fontSize:"0.8rem",fontWeight:"700",cursor:"pointer",fontFamily:"Arial,sans-serif",letterSpacing:"0.08em"},
  badge:(c,bg)=>({display:"inline-block",padding:"2px 8px",borderRadius:"4px",fontSize:"0.6rem",fontWeight:"700",background:bg||c+"22",color:c,border:`1px solid ${c}44`}),
  card: {background:"#0F172A",border:"1px solid #1E293B",borderRadius:"8px",padding:"16px",marginBottom:"16px"},
  ctitle:{fontSize:"0.62rem",letterSpacing:"0.15em",textTransform:"uppercase",color:"#3B82F6",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"},
  row:  {display:"flex",gap:"12px",flexWrap:"wrap"},
  hint: {fontSize:"0.65rem",color:"#475569",marginTop:"4px"},
  warn: {fontSize:"0.65rem",color:"#F59E0B",marginTop:"4px"},
};

const RISK_C = {CRITICAL:"#EF4444",HIGH:"#F59E0B",MODERATE:"#3B82F6",LOW:"#10B981"};

function getRiskLevel(hi) {
  if (hi === null || hi === undefined) return {level:"UNKNOWN",color:"#64748B"};
  if (hi > 10) return {level:"CRITICAL",color:RISK_C.CRITICAL};
  if (hi > 3)  return {level:"HIGH",color:RISK_C.HIGH};
  if (hi > 1)  return {level:"MODERATE",color:RISK_C.MODERATE};
  return {level:"LOW",color:RISK_C.LOW};
}

function ProbBar({pct, color, label}) {
  const risk = pct > 70 ? RISK_C.CRITICAL : pct > 45 ? RISK_C.HIGH : pct > 25 ? RISK_C.MODERATE : "#475569";
  return (
    <div style={{marginBottom:"8px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
        <span style={{fontSize:"0.72rem",color:"#94A3B8"}}>{label}</span>
        <span style={{fontSize:"0.72rem",fontWeight:"700",color:pct>45?risk:"#64748B"}}>{pct}%</span>
      </div>
      <div style={{background:"#1E293B",borderRadius:"3px",height:"5px",overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:"3px",transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}

export default function ARCWRCCECs() {
  const [form, setForm] = useState({
    province: "KwaZulu-Natal",
    wbt: "Surface Water",
    lat: -29.8,
    lon: 30.9,
    is_wwtp: false,
    is_coastal: false,
    is_surface: true,
  });
  const [results, setResults] = useState(null);
  const [ran, setRan] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const run = () => {
    const {province, wbt, lat, lon, is_wwtp, is_coastal, is_surface} = form;
    const features = [
      Math.abs(parseFloat(lat)),
      parseFloat(lon),
      WBT_SCORE[wbt] || 1,
      PROV_POP[province] || 5,
      PROV_URBAN[province] || 50,
      is_wwtp ? 1 : 0,
      is_coastal ? 1 : 0,
      is_surface ? 1 : 0,
    ];
    const clf = {};
    CATS.forEach(cat => { clf[cat] = rfPredict(RF_MODELS[cat], features); });

    const pH = HI_LOOKUP.prov[province];
    const wH = HI_LOOKUP.wbt[wbt];
    let hiEst = null;
    if (pH && wH && pH.med !== null) {
      const base = (pH.med * 0.5 + wH.med * 0.5);
      const scale = is_wwtp ? 2.5 : (is_coastal ? 0.4 : 1.0);
      hiEst = Math.round(base * scale * 10) / 10;
    }
    const hiRange = (() => {
      if (!pH || pH.med === null) return null;
      const lo = Math.round((pH.med * 0.3 + (wH?.med||0) * 0.3) * 10) / 10;
      const hi = Math.round((pH.p75 * 0.6 + (wH?.p75||0) * 0.6) * 10) / 10;
      return {lo, hi};
    })();

    const arvScale = province === "KwaZulu-Natal" ? 1.0 : province === "Gauteng" ? 0.8 : province === "Eastern Cape" ? 0.6 : 0.3;
    const arvProb = clf["Antiretrovirals (ARVs)"];

    setResults({features, clf, hiEst, hiRange, arvScale, arvProb, province, wbt, is_wwtp});
    setRan(true);
  };

  const wbtOpts = ["Surface Water","WWTP","Sediment","Marine/Coastal","Groundwater","Agricultural Water","Unclassified"];

  return (
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={S.title}>ARC-WRC CECs — Interactive Site Predictor</div>
        <div style={S.sub}>Enter site characteristics · Get predictions from 3 analytical models</div>
      </div>
      <div style={S.body}>

        {/* INPUT PANEL */}
        <div>
          <div style={S.panel}>
            <div style={S.ptitle}>📍 Site Characteristics</div>

            <div style={S.field}>
              <label style={S.label}>Province</label>
              <select style={S.select} value={form.province} onChange={e=>{
                const prov = e.target.value;
                const isCoastal = COASTAL_PROVINCES.has(prov);
                if (!isCoastal && form.wbt === "Marine/Coastal") {
                  setForm(f=>({...f, province:prov, wbt:"Surface Water", is_wwtp:false, is_coastal:false, is_surface:true}));
                } else {
                  setForm(f=>({...f, province:prov, is_coastal: isCoastal ? f.is_coastal : false}));
                }
              }}>
                {PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.label}>Water Body Type</label>
              <select style={S.select} value={form.wbt} onChange={e=>{
                const v=e.target.value;
                set("wbt",v);
                set("is_wwtp",v==="WWTP");
                set("is_coastal",v==="Marine/Coastal");
                set("is_surface",v==="Surface Water");
              }}>
                {wbtOpts
                  .filter(w => w !== "Marine/Coastal" || COASTAL_PROVINCES.has(form.province))
                  .map(w=><option key={w} value={w}>{w}</option>)}
              </select>
              {!COASTAL_PROVINCES.has(form.province) && (
                <div style={{fontSize:"0.62rem",color:"#F59E0B",marginTop:"4px"}}>
                  ⚠ Marine/Coastal not available — {form.province} is landlocked
                </div>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div style={S.field}>
                <label style={S.label}>Latitude (°S)</label>
                <input style={S.input} type="number" step="0.01" min="-35" max="-21"
                  value={form.lat} onChange={e=>set("lat",e.target.value)} />
                <div style={S.hint}>e.g. –29.85 (Durban)</div>
              </div>
              <div style={S.field}>
                <label style={S.label}>Longitude (°E)</label>
                <input style={S.input} type="number" step="0.01" min="16" max="33"
                  value={form.lon} onChange={e=>set("lon",e.target.value)} />
                <div style={S.hint}>e.g. 30.98 (eThekwini)</div>
              </div>
            </div>

            <div style={{...S.field,marginBottom:"6px"}}>
              <label style={S.label}>Site Flags</label>
              {[["is_wwtp","Is a WWTP site"],["is_coastal","Coastal / Marine"],["is_surface","Surface Water body"]].map(([k,lbl])=>{
                const isCoastalFlag = k === "is_coastal";
                const disabled = isCoastalFlag && !COASTAL_PROVINCES.has(form.province);
                return (
                  <label key={k} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.35:1}}>
                    <input type="checkbox" checked={form[k]} disabled={disabled}
                      onChange={e=>set(k,e.target.checked)}
                      style={{accentColor:"#3B82F6",width:"14px",height:"14px"}} />
                    <span style={{fontSize:"0.75rem",color:disabled?"#334155":"#94A3B8"}}>{lbl}{disabled?" (landlocked province)":""}</span>
                  </label>
                );
              })}
            </div>

            <div style={{marginTop:"6px",background:"#060D1A",border:"1px solid #1E293B",borderRadius:"6px",padding:"10px 12px",marginBottom:"16px"}}>
              <div style={{fontSize:"0.62rem",color:"#475569",letterSpacing:"0.1em",marginBottom:"6px",textTransform:"uppercase"}}>Features being used</div>
              <div style={{fontSize:"0.7rem",color:"#64748B",fontFamily:"monospace",lineHeight:1.9}}>
                {[["lat_abs",Math.abs(parseFloat(form.lat)||0).toFixed(2)],
                  ["lon_val",(parseFloat(form.lon)||0).toFixed(2)],
                  ["wb_score",WBT_SCORE[form.wbt]||1],
                  ["pop_million",PROV_POP[form.province]||5],
                  ["urban_pct",PROV_URBAN[form.province]||50+"%"],
                  ["is_wwtp",form.is_wwtp?1:0],
                  ["is_coastal",form.is_coastal?1:0],
                  ["is_surface",form.is_surface?1:0]
                ].map(([k,v])=>(
                  <div key={k}><span style={{color:"#3B82F6",minWidth:"100px",display:"inline-block"}}>{k}</span><span style={{color:"#94A3B8"}}>{v}</span></div>
                ))}
              </div>
            </div>

            <button style={S.btn} onClick={run}>▶  Run All 3 Predictions</button>
          </div>

          <div style={{...S.panel,marginTop:"16px"}}>
            <div style={S.ptitle}>⚡ Quick-fill by Province Capital</div>
            {[["Durban (KZN)",{province:"KwaZulu-Natal",lat:-29.85,lon:30.98,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],
              ["Johannesburg (GP)",{province:"Gauteng",lat:-26.2,lon:28.04,wbt:"WWTP",is_wwtp:true,is_coastal:false,is_surface:false}],
              ["Cape Town (WC)",{province:"Western Cape",lat:-33.93,lon:18.42,wbt:"Marine/Coastal",is_wwtp:false,is_coastal:true,is_surface:false}],
              ["Grahamstown (EC)",{province:"Eastern Cape",lat:-33.3,lon:26.52,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],
              ["Kimberley (NC)",{province:"Northern Cape",lat:-28.74,lon:24.77,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],
              ["Nelspruit (MP)",{province:"Mpumalanga",lat:-25.47,lon:30.97,wbt:"Surface Water",is_wwtp:false,is_coastal:false,is_surface:true}],
            ].map(([lbl,vals])=>(
              <button key={lbl} onClick={()=>setForm(f=>({...f,...vals}))}
                style={{display:"block",width:"100%",textAlign:"left",background:"transparent",border:"1px solid #1E293B",color:"#94A3B8",padding:"7px 10px",borderRadius:"5px",fontSize:"0.7rem",cursor:"pointer",marginBottom:"6px",fontFamily:"Arial,sans-serif",transition:"all 0.15s"}}
                onMouseOver={e=>{e.target.style.borderColor="#3B82F6";e.target.style.color="#60A5FA"}}
                onMouseOut={e=>{e.target.style.borderColor="#1E293B";e.target.style.color="#94A3B8"}}
              >↗ {lbl}</button>
            ))}
          </div>
        </div>

        {/* RESULTS */}
        <div>
          {!ran && (
            <div style={{...S.card,textAlign:"center",padding:"60px 20px",border:"1px dashed #1E3A5F"}}>
              <div style={{fontSize:"2.5rem",marginBottom:"14px"}}>🔬</div>
              <div style={{fontSize:"1rem",color:"#3B82F6",fontWeight:"700",marginBottom:"8px"}}>Configure your site and run predictions</div>
              <div style={{fontSize:"0.75rem",color:"#475569",lineHeight:1.7}}>
                Set the province, water body type, and coordinates on the left,<br/>
                then click <strong style={{color:"#60A5FA"}}>▶ Run All 3 Predictions</strong>
              </div>
            </div>
          )}

          {results && <>
            {/* MODEL 1: HI */}
            <div style={S.card}>
              <div style={S.ctitle}>
                <span style={{background:"#1D4ED8",color:"white",padding:"2px 8px",borderRadius:"4px",fontSize:"0.6rem",fontWeight:"700"}}>MODEL 1</span>
                Mixture Hazard Index Estimate
              </div>
              {results.hiEst === null ? (
                <div style={{fontSize:"0.75rem",color:"#F59E0B",padding:"10px 0"}}>⚠ No HI reference data available for {results.province}. Northern Cape has zero monitoring records — this is itself a key finding.</div>
              ) : (
                <>
                  <div style={{display:"flex",alignItems:"flex-end",gap:"16px",marginBottom:"14px"}}>
                    <div>
                      <div style={{fontSize:"0.6rem",color:"#64748B",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"2px"}}>Estimated HI</div>
                      <div style={{fontSize:"2.8rem",fontWeight:"700",color:getRiskLevel(results.hiEst).color,lineHeight:1}}>{results.hiEst}</div>
                    </div>
                    <div>
                      <div style={{marginBottom:"6px"}}><span style={S.badge(getRiskLevel(results.hiEst).color)}>{getRiskLevel(results.hiEst).level} RISK</span></div>
                      {results.hiRange && <div style={{fontSize:"0.68rem",color:"#64748B"}}>Plausible range: {results.hiRange.lo} – {results.hiRange.hi}</div>}
                    </div>
                  </div>
                  <div style={{background:"#060D1A",borderRadius:"6px",padding:"10px 14px",marginBottom:"10px"}}>
                    <div style={{fontSize:"0.62rem",color:"#475569",marginBottom:"8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>HI interpretation</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",textAlign:"center"}}>
                      {[["<1","LOW","#10B981"],["1–3","MODERATE","#3B82F6"],["3–10","HIGH","#F59E0B"],[">10","CRITICAL","#EF4444"]].map(([r,l,c])=>(
                        <div key={r} style={{background:c+"11",border:`1px solid ${c}44`,borderRadius:"4px",padding:"6px",opacity:r.includes(">10")&&results.hiEst>10||r==="1–3"&&results.hiEst>1&&results.hiEst<=3||r==="<1"&&results.hiEst<=1||r==="3–10"&&results.hiEst>3&&results.hiEst<=10?1:0.35}}>
                          <div style={{fontSize:"0.75rem",fontWeight:"700",color:c}}>{r}</div>
                          <div style={{fontSize:"0.6rem",color:c}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{fontSize:"0.68rem",color:"#64748B",lineHeight:1.7}}>
                    <strong style={{color:"#94A3B8"}}>How this is calculated:</strong> Based on median HI values observed at {results.province} sites ({HI_LOOKUP.prov[results.province]?.med ?? "N/A"}) and {results.wbt} environments ({HI_LOOKUP.wbt[results.wbt]?.med ?? "N/A"}), blended 50/50 with a {results.is_wwtp?"2.5× WWTP multiplier applied.":"1.0× multiplier for non-WWTP environments."} HI = Σ (detected concentration ÷ PNEC) across all compounds at the site.
                  </div>
                </>
              )}
            </div>

            {/* MODEL 2: Classifier */}
            <div style={S.card}>
              <div style={S.ctitle}>
                <span style={{background:"#7C3AED",color:"white",padding:"2px 8px",borderRadius:"4px",fontSize:"0.6rem",fontWeight:"700"}}>MODEL 2</span>
                CEC Detection Probability (Random Forest)
              </div>
              <div style={{fontSize:"0.65rem",color:"#475569",marginBottom:"14px",lineHeight:1.6}}>
                Probability that each CEC category would be detected if this site were sampled. Trained on 140 georeferenced SA sites.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px"}}>
                <div>{CATS.slice(0,5).map(cat=><ProbBar key={cat} pct={results.clf[cat]||0} color={CAT_COL[cat]} label={CAT_SHORT[cat]} />)}</div>
                <div>{CATS.slice(5).map(cat=><ProbBar key={cat} pct={results.clf[cat]||0} color={CAT_COL[cat]} label={CAT_SHORT[cat]} />)}</div>
              </div>
              <div style={{marginTop:"12px"}}>
                {(() => {
                  const sorted = CATS.map(c=>({cat:c,p:results.clf[c]||0})).sort((a,b)=>b.p-a.p);
                  const top = sorted.slice(0,3);
                  const flagged = sorted.filter(x=>x.p>60);
                  return (
                    <div style={{background:"#060D1A",borderRadius:"6px",padding:"12px 14px"}}>
                      <div style={{fontSize:"0.62rem",color:"#475569",marginBottom:"8px",letterSpacing:"0.1em",textTransform:"uppercase"}}>Interpretation</div>
                      <div style={{fontSize:"0.72rem",color:"#94A3B8",lineHeight:1.8}}>
                        <strong style={{color:"#60A5FA"}}>Most likely detections:</strong>{" "}
                        {top.map(x=><span key={x.cat} style={{color:CAT_COL[x.cat],fontWeight:"700"}}>{CAT_SHORT[x.cat]} ({x.p}%){" "}</span>)}
                        {flagged.length>0&&<><br/><strong style={{color:"#EF4444"}}>⚠ High-probability (&gt;60%):</strong>{" "}{flagged.map(x=><span key={x.cat} style={{color:CAT_COL[x.cat]}}>{CAT_SHORT[x.cat]} </span>)}</>}
                        {results.clf["Antiretrovirals (ARVs)"]>30&&results.province==="KwaZulu-Natal"&&<><br/><span style={{color:"#10B981"}}>ARV signal elevated — consistent with KZN WWTP catchment location.</span></>}
                        {results.clf["Antiretrovirals (ARVs)"]<5&&<><br/><span style={{color:"#475569"}}>ARV probability very low — outside known KZN treatment plant catchments.</span></>}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* MODEL 3: ARV Forecast */}
            <div style={S.card}>
              <div style={S.ctitle}>
                <span style={{background:"#059669",color:"white",padding:"2px 8px",borderRadius:"4px",fontSize:"0.6rem",fontWeight:"700"}}>MODEL 3</span>
                ARV Environmental Loading Forecast
              </div>
              <div style={{fontSize:"0.65rem",color:"#475569",marginBottom:"14px",lineHeight:1.6}}>
                Predicted concentrations in receiving water (ng/L) scaled by province ART patient load ({Math.round(results.arvScale*100)}% of KZN baseline for {results.province}).
              </div>

              {results.arvScale < 0.5 && (
                <div style={{background:"#F59E0B11",border:"1px solid #F59E0B44",borderRadius:"6px",padding:"8px 12px",marginBottom:"12px",fontSize:"0.68rem",color:"#F59E0B"}}>
                  ⚠ {results.province} has a lower ART patient density than KZN. ARV concentrations will be lower, but still present near WWTP discharge points.
                </div>
              )}

              {(() => {
                const scaledData = ARV_TIMESERIES.map(row => {
                  const out = {year: row.year, proj: row.proj};
                  Object.keys(ARV_DRUG_COL).forEach(drug => {
                    out[drug] = Math.round(row[drug] * results.arvScale * 10) / 10;
                  });
                  return out;
                });
                const historical = scaledData.filter(d => !d.proj);
                const projected  = scaledData.filter(d => d.proj);
                const bridge = scaledData[scaledData.findIndex(d=>d.proj) - 1];
                const projWithBridge = bridge ? [bridge, ...projected] : projected;

                const CustomTooltip = ({active, payload, label}) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{background:"#0F172A",border:"1px solid #1E293B",borderRadius:"6px",padding:"10px 14px",fontSize:"0.68rem"}}>
                      <div style={{color:"#60A5FA",fontWeight:"700",marginBottom:"6px"}}>{label}{payload[0]?.payload?.proj ? " (projected)" : ""}</div>
                      {payload.map(p=>(
                        <div key={p.dataKey} style={{color:ARV_DRUG_COL[p.dataKey]||"#94A3B8",marginBottom:"2px"}}>
                          {p.dataKey}: <strong>{p.value} ng/L</strong>
                          {ARV_PNEC[p.dataKey] && <span style={{color:"#475569",fontSize:"0.6rem"}}> (PNEC: {ARV_PNEC[p.dataKey].toLocaleString()})</span>}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div style={{marginBottom:"18px"}}>
                    <div style={{fontSize:"0.62rem",color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"10px"}}>
                      Concentration Forecast 2004–2040 — {results.province} · Solid = historical · Dashed = projected
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart margin={{left:8,right:20,top:6,bottom:4}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="year" type="number" domain={[2004,2040]} tickCount={10}
                          tick={{fill:"#64748B",fontSize:9}} tickFormatter={v=>String(v)} />
                        <YAxis tick={{fill:"#64748B",fontSize:9}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}
                          label={{value:"ng/L",angle:-90,position:"insideLeft",fill:"#475569",fontSize:8,dx:-4}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{fontSize:"0.65rem",paddingTop:"8px"}}
                          formatter={(val)=><span style={{color:ARV_DRUG_COL[val]||"#94A3B8"}}>{val}</span>} />
                        <ReferenceLine y={ARV_PNEC.Efavirenz * results.arvScale} stroke="#EF4444"
                          strokeDasharray="6 3" strokeWidth={1}
                          label={{value:`EFV PNEC (${Math.round(ARV_PNEC.Efavirenz*results.arvScale)} ng/L)`,fill:"#EF444488",fontSize:8,position:"insideTopRight"}} />
                        {Object.keys(ARV_DRUG_COL).map(drug=>(
                          <Line key={`h-${drug}`} data={historical} dataKey={drug} name={drug}
                            stroke={ARV_DRUG_COL[drug]} strokeWidth={2} dot={false} legendType="none" />
                        ))}
                        {Object.keys(ARV_DRUG_COL).map(drug=>(
                          <Line key={`p-${drug}`} data={projWithBridge} dataKey={drug} name={drug}
                            stroke={ARV_DRUG_COL[drug]} strokeWidth={2} strokeDasharray="6 3"
                            dot={(props)=>{
                              if(props.payload.year!==2040) return null;
                              return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={ARV_DRUG_COL[drug]} stroke="none"/>;
                            }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{fontSize:"0.6rem",color:"#334155",textAlign:"right",marginTop:"2px"}}>
                      Projection assumes NSP 2023–2028 ART targets. Vertical dashed = 2022 last measured point.
                    </div>
                  </div>
                );
              })()}

              <div style={{fontSize:"0.62rem",color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>2040 Projection Summary</div>
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",width:"100%",fontSize:"0.68rem"}}>
                  <thead>
                    <tr style={{background:"#1E293B"}}>
                      {["Drug","WWTP Removal","2022 (ng/L)","2030 (ng/L)","2040 (ng/L)","PNEC (ng/L)","2040 HQ","Risk"].map(h=>(
                        <th key={h} style={{padding:"7px 10px",color:"#94A3B8",fontWeight:"600",textAlign:"left",borderBottom:"1px solid #1E293B",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(ARV_2030).map(([drug,d],i)=>{
                      const ts2040 = ARV_TIMESERIES.find(r=>r.year===2040);
                      const c22  = Math.round(d.c2022 * results.arvScale * 10) / 10;
                      const c30  = Math.round(d.c2030 * results.arvScale * 10) / 10;
                      const c40  = Math.round((ts2040?.[drug]||d.c2030*1.1) * results.arvScale * 10) / 10;
                      const hq40 = (c40 / d.pnec).toFixed(3);
                      const hqNum = parseFloat(hq40);
                      const hqCol = hqNum>1?"#EF4444":hqNum>0.3?"#F59E0B":"#10B981";
                      const reCol = d.re<0?"#EF4444":d.re>80?"#10B981":"#F59E0B";
                      return (
                        <tr key={drug} style={{background:i%2===0?"#0F172A":"#060D1A"}}>
                          <td style={{padding:"7px 10px",fontWeight:"700",color:ARV_DRUG_COL[drug]||"#F0F9FF"}}>{drug}</td>
                          <td style={{padding:"7px 10px",color:reCol,fontWeight:"600"}}>{d.re<0?`${d.re}% ⚠`:`${d.re}%`}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#64748B"}}>{c22}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#94A3B8"}}>{c30}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",fontWeight:"700",color:"#F0F9FF"}}>{c40}</td>
                          <td style={{padding:"7px 10px",textAlign:"right",color:"#475569"}}>{d.pnec.toLocaleString()}</td>
                          <td style={{padding:"7px 10px",textAlign:"center",fontWeight:"700",color:hqCol,fontSize:"0.72rem"}}>{hq40}</td>
                          <td style={{padding:"7px 10px"}}><span style={S.badge(RISK_C[d.risk])}>{d.risk}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{marginTop:"12px",background:"#060D1A",borderRadius:"6px",padding:"12px 14px",fontSize:"0.68rem",color:"#64748B",lineHeight:1.8}}>
                <strong style={{color:"#60A5FA"}}>2040 outlook for {results.province}:</strong>{" "}
                {results.arvScale >= 0.9
                  ? "By 2040, Efavirenz will reach ~164 ng/L — 33% of its PNEC. Without WWTP upgrades, it will breach the threshold before 2045. Lopinavir continues to increase through biological treatment."
                  : results.arvScale >= 0.6
                  ? "Moderate ARV loading projected to 2040. Efavirenz and Nevirapine remain priority compounds. Province-level monitoring data are critically needed."
                  : "Lower ARV concentrations than KZN, but the trajectory is the same. Any WWTP discharge point will carry measurable ARV loads — Efavirenz and Lopinavir are the least efficiently removed."}
              </div>
            </div>
          </>}
        </div>
      </div>
      <div style={{textAlign:"center",padding:"14px",fontSize:"0.58rem",color:"#1E3A5F",borderTop:"1px solid #0F1A2E",letterSpacing:"0.1em"}}>
        © ZAMBEZI ANALYTICS 2026 · ARC-WRC CECs PREDICTIVE ANALYTICS · MODELS: MIXTURE HI · RF CLASSIFIER · ARV MASS BALANCE FORECAST
      </div>
    </div>
  );
}