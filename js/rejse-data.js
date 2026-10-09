/* Den guidede rejse: niveauer, trin og krav. Sangtitler nævnes kun som eksempler – ingen tekster eller tabs. */
var REJSE = [
 { niveau: 0, titel: 'Klar til start', intro: 'Lær guitaren at kende, sid godt, stem guitaren og find dine fingre.',
   trin: [
   { id: '0-dele', titel: 'Guitarens dele', type: 'laes', tekst: [
     '<b>Kroppen</b> er den store hule del. <b>Lydhullet</b> sidder i midten – her slår du strengene.',
     '<b>Halsen</b> er den lange del. Oven på halsen sidder <b>gribebrættet</b> med metaltråde på tværs – de hedder <b>båndtråde</b>. Mellemrummet mellem to båndtråde er et <b>bånd</b>.',
     '<b>Sadlen</b> er den lille hvide kant øverst på halsen. 1. bånd er det første felt lige under sadlen.',
     '<b>Hovedet</b> har <b>stemmeskruerne</b>, som strammer og løsner strengene.',
     '<b>Strengene</b> tælles nedefra: 1. streng er den tyndeste (lys E), 6. streng er den tykkeste (dyb E). Huskeregel for de åbne strenge fra tyk til tynd: <b>E A D G H E</b> – "En Abe Danser Glad Hele Eftermiddagen".'] },
   { id: '0-hold', titel: 'Sådan holder du guitaren', type: 'laes', tekst: [
     'Sid på en stol uden armlæn med begge fødder i gulvet. Læg guitarens indhak på dit højre lår.',
     'Guitaren står næsten lodret op ad kroppen – læn den kun en smule bagud, så du lige kan se gribebrættet.',
     'Højre underarm hviler på kanten af guitarkroppen, så hånden hænger løst over lydhullet.',
     'Skuldrene er nede og afslappede. Venstre albue hænger frit ned langs siden – den skal ikke løftes ud.',
     'Se mere under <b>Krop & råd</b> – det er skrevet med fysioterapeutens øjne.'] },
   { id: '0-stem', titel: 'Stem guitaren', type: 'stem', tekst: [
     'En ustemt guitar lyder forkert, selv når fingrene sidder rigtigt – og så kan appen heller ikke høre dine akkorder.',
     'Åbn <b>stemmeapparatet</b>, slå én åben streng ad gangen og drej stemmeskruen langsomt, til viseren står i midten.',
     'Tip: Stem altid <i>op</i> til tonen. Er den for høj, så løsn lidt under tonen og stram op igen – så holder stemningen bedre.'] },
   { id: '0-fingre', titel: 'Fingernumre og diagrammer', type: 'laes', tekst: [
     'Venstre hånds fingre har numre: <b>1 = pegefinger, 2 = langfinger, 3 = ringfinger, 4 = lillefinger</b>. Tommelfingeren har intet nummer – den hviler bag halsen.',
     'I akkorddiagrammerne står guitaren på højkant, som om du kigger direkte på gribebrættet. Den tykkeste streng er til venstre.',
     'Den tykke streg øverst er sadlen. Prikkerne viser, hvor fingrene skal stå – tallet i prikken er fingeren.',
     '<b>O</b> over en streng betyder, at den skal klinge åbent. <b>X</b> betyder, at du ikke skal slå den.',
     'Sæt fingerspidsen i den ende af båndet, der vender mod lydhullet – tæt ved båndtråden, men ikke oven på den. Så skal du trykke mindst muligt.'] },
   { id: '0-em7', titel: 'Din første lyd: Em7', type: 'akkord', akkord: 'Em7', krav: { dage: 1 } }
 ]},
 { niveau: 1, titel: 'De første akkorder', intro: 'E-mol og A-mol ligner hinanden og er gode at starte med.',
   trin: [
   { id: '1-em', titel: 'E-mol', type: 'akkord', akkord: 'Em', krav: { dage: 2 } },
   { id: '1-am', titel: 'A-mol', type: 'akkord', akkord: 'Am', krav: { dage: 2 } },
   { id: '1-em-am', titel: 'Skift: E-mol ↔ A-mol', type: 'skift', skift: ['Em', 'Am'], krav: { skift: 30 } }
 ]},
 { niveau: 2, titel: 'C, G og D', intro: 'De tre dur-akkorder, der bruges i utallige sange. Brug gerne de lette versioner først.',
   trin: [
   { id: '2-c', titel: 'C-dur', type: 'akkord', akkord: 'C', krav: { dage: 2 } },
   { id: '2-g', titel: 'G-dur', type: 'akkord', akkord: 'G', krav: { dage: 2 } },
   { id: '2-d', titel: 'D-dur', type: 'akkord', akkord: 'D', krav: { dage: 2 } }
 ]},
 { niveau: 3, titel: 'Akkordskift', intro: 'Det svære ved guitar er ikke akkorderne – det er skiftene. Her træner du dem ét ad gangen.',
   trin: [
   { id: '3-metode', titel: 'Et-minut-skift-metoden', type: 'laes', tekst: [
     'Vælg to akkorder. Start uret og skift frem og tilbage mellem dem i ét minut. Slå én gang på hver akkord.',
     'Tæl hvor mange skift du når. Det er dit tal for i dag – skriv det ind i appen.',
     'Gør det én gang om dagen for hvert skift. Tallet stiger hurtigt, og det er meget motiverende at se.',
     'Det handler om <b>rene, rolige skift</b> – ikke om at jage. Løft fingrene mindst muligt, og flyt dem som en samlet "form".',
     'Når du når ca. 30 skift i minuttet, er skiftet klar til at blive brugt i en sang.'] },
   { id: '3-am-c', titel: 'Skift: A-mol ↔ C', type: 'skift', skift: ['Am', 'C'], krav: { skift: 30 } },
   { id: '3-g-d', titel: 'Skift: G ↔ D', type: 'skift', skift: ['G', 'D'], krav: { skift: 30 } },
   { id: '3-c-g', titel: 'Skift: C ↔ G', type: 'skift', skift: ['C', 'G'], krav: { skift: 30 } },
   { id: '3-em-d', titel: 'Skift: E-mol ↔ D', type: 'skift', skift: ['Em', 'D'], krav: { skift: 30 } }
 ]},
 { niveau: 4, titel: 'Slagmønstre', intro: 'Nu får højre hånd rytme. Hold armen løs og bevægelsen fra albuen.',
   trin: [
   { id: '4-fire', titel: 'Fire nedslag', type: 'slag', moenster: 'fire', akkord: 'G', krav: { dage: 1 } },
   { id: '4-nno', titel: 'Ned – ned-op', type: 'slag', moenster: 'nedop', akkord: 'C', krav: { dage: 2 } },
   { id: '4-klassisk', titel: 'Det klassiske mønster', type: 'slag', moenster: 'klassisk', akkord: 'G', krav: { dage: 2 } },
   { id: '4-takt', titel: 'Skift i takt', type: 'sang', sang: 'takt', krav: { dage: 2 } }
 ]},
 { niveau: 5, titel: 'Dine første sange', intro: 'Spil akkordrækker, som bruges i kendte sange. Find sangen i din egen musiktjeneste og spil med.',
   trin: [
   { id: '5-heaven', titel: 'G – D – Am  /  G – D – C', type: 'sang', sang: 'heaven', krav: { dage: 2 } },
   { id: '5-alabama', titel: 'D – C – G', type: 'sang', sang: 'alabama', krav: { dage: 2 } },
   { id: '5-50er', titel: 'G – Em – C – D', type: 'sang', sang: 'halvtreds', krav: { dage: 2 } },
   { id: '5-zombie', titel: 'Em – C – G – D', type: 'sang', sang: 'zombie', krav: { dage: 2 } }
 ]}
];

var SLAGMOENSTRE = {
  fire:     { navn: 'Fire nedslag', taelling: ['1', '&', '2', '&', '3', '&', '4', '&'], slag: ['N', '', 'N', '', 'N', '', 'N', ''], tempo: 60,
              tip: 'Ét roligt nedslag på hvert taktslag. Bevægelsen kommer fra albuen, håndleddet er løst.' },
  nedop:    { navn: 'Ned – ned-op', taelling: ['1', '&', '2', '&', '3', '&', '4', '&'], slag: ['N', '', 'N', 'O', 'N', '', 'N', 'O'], tempo: 60,
              tip: 'Hånden svinger hele tiden op og ned som et pendul – den rammer bare ikke strengene på de tomme pladser.' },
  klassisk: { navn: 'Det klassiske mønster', taelling: ['1', '&', '2', '&', '3', '&', '4', '&'], slag: ['N', '', 'N', 'O', '', 'O', 'N', 'O'], tempo: 70,
              tip: 'Ned, ned-op, (pause) op, ned-op. Sig det højt: "ned – ned op – – op ned op". Hånden bliver ved med at svinge i pausen.' }
};

/* Akkordrækker. 'eksempler' er kun sangtitler som pejlemærke – akkorderne kan variere mellem versioner. */
var SANGE = {
  takt:      { navn: 'Skift i takt', raekke: ['G', 'C', 'G', 'D'], slagPrAkkord: 4, tempo: 60, eksempler: [], tip: 'Fire nedslag på hver akkord. Begynd at flytte fingrene allerede på slag 4.' },
  heaven:    { navn: 'G – D – Am / G – D – C', raekke: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C'], slagPrAkkord: 4, tempo: 68, eksempler: ['Knockin\' on Heaven\'s Door (Bob Dylan)'], tip: 'Rolig rundgang – perfekt første sang.' },
  alabama:   { navn: 'D – C – G', raekke: ['D', 'C', 'G', 'G'], slagPrAkkord: 4, tempo: 70, eksempler: ['Sweet Home Alabama (Lynyrd Skynyrd) – i en forenklet version'], tip: 'D og C skifter hurtigt – hold dig til fire nedslag i starten.' },
  halvtreds: { navn: 'G – Em – C – D', raekke: ['G', 'Em', 'C', 'D'], slagPrAkkord: 4, tempo: 70, eksempler: ['Stand by Me (Ben E. King) – spillet i G', 'Mange 50\'er- og 60\'er-sange bruger netop denne rundgang'], tip: 'G til Em er let: kun to fingre flytter sig.' },
  zombie:    { navn: 'Em – C – G – D', raekke: ['Em', 'C', 'G', 'D'], slagPrAkkord: 4, tempo: 76, eksempler: ['Zombie (The Cranberries) – forenklet'], tip: 'Samme fire akkorder som før, bare i en anden rækkefølge.' }
};

var OPVARMNING = [
  'Ryst hænderne løst i 10 sekunder.',
  'Knyt hånden blødt og åbn den helt – 10 gange.',
  'Rør tommelfingeren mod hver fingerspids efter tur – 3 runder.',
  'Træk forsigtigt fingrene bagud med den anden hånd (håndfladen frem) i 15 sekunder. Det må stramme, ikke gøre ondt.',
  'Rul skuldrene bagud 5 gange, og lad dem falde ned.'
];

var KROP_RAAD = [
  { titel: 'Korte pas slår lange', tekst: 'Fem til femten minutter hver dag giver mere end en time om søndagen. Fingrene, senerne og hjernen lærer bedst i små doser med pauser imellem.' },
  { titel: 'Ømme fingerspidser er normalt', tekst: 'De første 2–3 uger gør fingerspidserne ondt, fordi huden skal danne hård hud (kallus). Stop, når det bliver mere end let ømt, og spil hellere igen i morgen. Undgå at bløde huden op lige før – spil fx ikke lige efter et varmt bad.' },
  { titel: 'Hvornår skal du holde pause?', tekst: 'Hold pause og spørg en fagperson, hvis du får skarp smerte, prikken eller følelsesløshed i fingrene, smerter i håndleddet eller hævede fingerled. Det er ikke "en del af det".' },
  { titel: 'Lige håndled', tekst: 'Venstre håndled skal være så lige som muligt. Et stærkt knæk bagover øger trykket i håndleddet. Flyt hellere guitarhalsen lidt op og albuen lidt frem end at bøje håndleddet.' },
  { titel: 'Tommelfingeren hviler – den klemmer ikke', tekst: 'Tommelfingeren hviler med puden midt bag halsen, cirka bag 2. bånd. Den modholder bare. Klemmer du hårdt, bliver hånden træt og øm. Prøv at trykke så let, at tonen lige netop er ren.' },
  { titel: 'Buede fingre, spidserne ned', tekst: 'Fingrene står som små broer, så de ikke rører nabostrengene. Klip neglene på venstre hånd korte – ellers kan du ikke stå på spidsen.' },
  { titel: 'Afslappede skuldre og vejrtrækning', tekst: 'Tjek ind imellem: Er skuldrene trukket op? Holder du vejret? Slip, og træk vejret roligt ud. Spændinger smitter fra skulder til hånd.' },
  { titel: 'Siddestilling', tekst: 'Sid på en stol uden armlæn, begge fødder i gulvet og ryggen let fremme fra ryglænet. Guitaren hviler på højre lår. Undgå at krumme dig ind over guitaren for at se gribebrættet – kig hellere med øjnene end med hele overkroppen.' },
  { titel: 'Hviledag', tekst: 'Har du spillet seks dage i træk, så giv gerne fingrene en hviledag. En enkelt hviledag bryder ikke din stribe – først to dage i træk uden spil gør.' }
];

if (typeof module !== 'undefined') module.exports = { REJSE: REJSE, SLAGMOENSTRE: SLAGMOENSTRE, SANGE: SANGE, OPVARMNING: OPVARMNING, KROP_RAAD: KROP_RAAD };
