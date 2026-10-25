/* Ruta Spanish — course content.
   Format for words and sentences:  "Spanish|alt Spanish = English|alt English ~ optional hint"
   Dialogue lines:                  "Speaker: Spanish = English"
   Add new units to the end of COURSE and they appear on the path automatically. */

const VERBS = {
  'ser|pres':    ['soy','eres','es','somos','sois','son'],
  'estar|pres':  ['estoy','estás','está','estamos','estáis','están'],
  'tener|pres':  ['tengo','tienes','tiene','tenemos','tenéis','tienen'],
  'ir|pres':     ['voy','vas','va','vamos','vais','van'],
  'hablar|pres': ['hablo','hablas','habla','hablamos','habláis','hablan'],
  'comer|pres':  ['como','comes','come','comemos','coméis','comen'],
  'vivir|pres':  ['vivo','vives','vive','vivimos','vivís','viven'],
  'querer|pres': ['quiero','quieres','quiere','queremos','queréis','quieren'],
  'poder|pres':  ['puedo','puedes','puede','podemos','podéis','pueden'],
  'hacer|pres':  ['hago','haces','hace','hacemos','hacéis','hacen'],
  'hablar|pret': ['hablé','hablaste','habló','hablamos','hablasteis','hablaron'],
  'comer|pret':  ['comí','comiste','comió','comimos','comisteis','comieron'],
  'ir|pret':     ['fui','fuiste','fue','fuimos','fuisteis','fueron'],
  'hacer|pret':  ['hice','hiciste','hizo','hicimos','hicisteis','hicieron'],
  'tener|pret':  ['tuve','tuviste','tuvo','tuvimos','tuvisteis','tuvieron']
};
const VERB_EN = { ser:'to be', estar:'to be', tener:'to have', ir:'to go', hablar:'to speak', comer:'to eat',
  vivir:'to live', querer:'to want', poder:'to be able to', hacer:'to do, to make' };

const COURSE = [
{ id:'saludos', es:'Saludos', en:'Greetings', band:'A1',
  tip:`<p>Spanish questions open with <b>¿</b> and exclamations with <b>¡</b>: <i>¿Qué tal?</i> <i>¡Hola!</i></p>
<p>Vowels always sound the same: <b>a</b> as in father, <b>e</b> as in met, <b>i</b> as in machine, <b>o</b> as in more (short), <b>u</b> as in rule. <b>h</b> is silent, <b>ñ</b> sounds like "ny", <b>ll</b> and <b>y</b> like "y", and <b>j</b> like a throaty "h".</p>
<p>Accent marks matter: <i>sí</i> means yes, <i>si</i> means if. Ruta forgives a missing accent but points it out.</p>
<p><b>Tú</b> is informal "you" (friends, family). <b>Usted</b> is formal (strangers, older people, service staff).</p>`,
  words:['hola = hello|hi','adiós = goodbye|bye','buenos días = good morning','buenas tardes = good afternoon',
    'buenas noches = good night|good evening','gracias = thank you|thanks','por favor = please','sí = yes','no = no',
    'perdón = sorry|excuse me','de nada = you\'re welcome','¿qué tal? = how\'s it going?|how are you?'],
  sents:['Hola, ¿qué tal? = Hello, how are you?|Hi, how are you?|Hi, how\'s it going?|Hello, how\'s it going?',
    'Muy bien, gracias. = Very well, thank you.|Very well, thanks.|Very good, thanks.|Very good, thank you.',
    'Buenos días, señora. = Good morning, ma\'am.|Good morning, madam.',
    'Me llamo Ana. = My name is Ana.|I\'m called Ana.|I am called Ana.',
    '¿Cómo te llamas? = What\'s your name?|What is your name?',
    'Mucho gusto. = Nice to meet you.|Pleased to meet you.',
    'Hasta luego. = See you later.'],
  dlg:['Marco: ¡Hola! ¿Qué tal? = Hi! How\'s it going?',
    'Lucía: Muy bien, gracias. ¿Y tú? = Very well, thanks. And you?',
    'Marco: Bien. ¿Cómo te llamas? = Good. What\'s your name?',
    'Lucía: Me llamo Lucía. ¿Y tú? = My name is Lucía. And you?',
    'Marco: Soy Marco. Mucho gusto. = I\'m Marco. Nice to meet you.',
    'Lucía: Encantada. = Delighted to meet you.'] },

{ id:'personas', es:'Personas', en:'People and "ser"', band:'A1', verbs:['ser|pres'],
  tip:`<p>Every noun is masculine or feminine. "The" is <b>el</b> (masculine) or <b>la</b> (feminine); "a" is <b>un</b> or <b>una</b>.</p>
<p><b>Ser</b> means "to be" for identity, origin and what someone is like: <i>Soy de Australia</i>, <i>Es simpático</i>.</p>
<p>Spanish usually drops the pronoun because the verb ending already says who: <i>Soy Carlos</i> = I'm Carlos. Ruta accepts both.</p>`,
  words:['yo = I','tú = you ~ informal','él = he','ella = she','nosotros = we','ellos = they',
    'el hombre = the man|man','la mujer = the woman|woman','el niño = the boy|boy|the child','la niña = the girl|girl',
    'el amigo = the friend|friend','soy = I am|I\'m ~ ser','eres = you are|you\'re ~ ser','somos = we are|we\'re ~ ser'],
  sents:['Yo soy Carlos. = I am Carlos.|I\'m Carlos.','Ella es mi amiga. = She is my friend.|She\'s my friend.',
    'Tú eres muy simpático. = You are very nice.|You\'re very nice.','Somos amigos. = We are friends.|We\'re friends.',
    'Él es un hombre. = He is a man.|He\'s a man.','Ellos son de México. = They are from Mexico.|They\'re from Mexico.',
    '¿De dónde eres? = Where are you from?','Soy de Australia. = I am from Australia.|I\'m from Australia.'] },

{ id:'numeros', es:'Números', en:'Numbers', band:'A1',
  tip:`<p><b>Hay</b> means both "there is" and "there are": <i>Hay tres gatos</i>.</p>
<p>Age uses <b>tener</b> (to have): <i>Tengo veinte años</i>, literally "I have twenty years".</p>
<p>16 to 29 are written as one word: dieciséis, diecisiete, veintiuno, veintidós…</p>
<p>Time: <i>Es la una</i> (one o'clock) but <i>Son las dos, son las diez</i>.</p>`,
  words:['uno = one|1','dos = two|2','tres = three|3','cuatro = four|4','cinco = five|5','seis = six|6','siete = seven|7',
    'ocho = eight|8','nueve = nine|9','diez = ten|10','once = eleven|11','doce = twelve|12','veinte = twenty|20','cien = a hundred|one hundred|100'],
  sents:['Tengo dos hermanos. = I have two brothers.|I have two siblings.','Hay tres gatos. = There are three cats.',
    '¿Cuántos años tienes? = How old are you?','Tengo veinte años. = I am twenty years old.|I\'m twenty years old.|I am twenty.|I\'m twenty.',
    'Son las diez. = It is ten o\'clock.|It\'s ten o\'clock.|It is ten.|It\'s ten.','El número es cinco. = The number is five.'] },

{ id:'comida', es:'Comida', en:'Food and drink', band:'A1',
  tip:`<p>The present tense covers both "I eat" and "I am eating": <i>como</i>.</p>
<p>To make a sentence negative, put <b>no</b> before the verb: <i>No como carne</i>.</p>
<p><i>El agua</i> is feminine (<i>el agua fría</i>) but takes <b>el</b> because it starts with a stressed "a".</p>`,
  words:['el agua = water|the water','el pan = bread|the bread','la leche = milk|the milk','el café = coffee|the coffee',
    'la manzana = apple|the apple|an apple','el queso = cheese|the cheese','la carne = meat|the meat','el pescado = fish|the fish ~ as food',
    'el arroz = rice|the rice','la cerveza = beer|the beer','como = I eat ~ comer','bebo = I drink ~ beber'],
  sents:['Yo como pan. = I eat bread.|I am eating bread.|I\'m eating bread.','Bebo agua. = I drink water.|I am drinking water.|I\'m drinking water.',
    'Ella come una manzana. = She eats an apple.|She is eating an apple.|She\'s eating an apple.',
    'Quiero un café, por favor. = I want a coffee, please.|I\'d like a coffee, please.',
    'No como carne. = I don\'t eat meat.|I do not eat meat.','El queso es bueno. = The cheese is good.'] },

{ id:'familia', es:'Familia', en:'Family', band:'A1',
  tip:`<p>Possessives: <b>mi / mis</b> (my), <b>tu / tus</b> (your), <b>su / sus</b> (his, her, their, or formal your). Add -s with plural nouns: <i>mis padres</i>.</p>
<p>A masculine plural covers mixed groups: <i>los padres</i> = parents, <i>los hermanos</i> = brothers and sisters.</p>
<p>No article before a job after <i>ser</i>: <i>Es profesora</i> = She's a teacher.</p>`,
  words:['la madre = mother|the mother|mum|mom','el padre = father|the father|dad','el hermano = brother|the brother',
    'la hermana = sister|the sister','el hijo = son|the son','la hija = daughter|the daughter','los padres = parents|the parents',
    'el abuelo = grandfather|grandpa|the grandfather','la abuela = grandmother|grandma|the grandmother','mi = my',
    'tu = your ~ informal','su = his|her|their ~ also formal "your"'],
  sents:['Mi madre es profesora. = My mother is a teacher.|My mum is a teacher.|My mom is a teacher.',
    'Tu hermano es alto. = Your brother is tall.','Tengo una hermana. = I have a sister.|I have one sister.',
    'Mis padres viven en Madrid. = My parents live in Madrid.',
    'Su hija se llama Lucía. = Her daughter is called Lucía.|His daughter is called Lucía.|Her daughter\'s name is Lucía.|His daughter\'s name is Lucía.',
    'Mi abuela es muy simpática. = My grandmother is very nice.|My grandma is very nice.'] },

{ id:'verbos-ar', es:'Verbos en -ar', en:'Regular -ar verbs', band:'A1', verbs:['hablar|pres'],
  tip:`<p>Most Spanish verbs end in <b>-ar</b>. Drop the -ar and add: <b>-o, -as, -a, -amos, -áis, -an</b>.</p>
<p><i>hablar → hablo, hablas, habla, hablamos, habláis, hablan</i></p>
<p><b>Vosotros</b> (you all, informal) is used in Spain. Latin America uses <b>ustedes</b> with the -an form for every "you all".</p>`,
  words:['hablar = to speak|to talk','trabajar = to work','estudiar = to study','escuchar = to listen|to listen to',
    'cocinar = to cook','caminar = to walk','hablo = I speak|I talk','hablas = you speak|you talk',
    'habla = he speaks|she speaks|he talks|she talks','hablamos = we speak|we talk','hablan = they speak|they talk'],
  sents:['Hablo un poco de español. = I speak a little Spanish.','¿Hablas inglés? = Do you speak English?',
    'Trabajamos los lunes. = We work on Mondays.','Ella estudia mucho. = She studies a lot.',
    'Ellos escuchan música. = They listen to music.|They are listening to music.|They\'re listening to music.',
    'Mi padre cocina muy bien. = My father cooks very well.|My dad cooks very well.'] },

{ id:'lugares', es:'Lugares', en:'Places, "estar" and "ir"', band:'A1', verbs:['estar|pres','ir|pres'],
  tip:`<p>Two verbs mean "to be". <b>Estar</b> is for location and temporary states: <i>Estoy en casa</i>, <i>Estoy cansado</i>. <b>Ser</b> is for identity and lasting traits.</p>
<p><b>a + el = al</b>: <i>Vamos al centro</i>. Likewise <b>de + el = del</b>.</p>
<p><b>Ir</b> (to go) is irregular: voy, vas, va, vamos, vais, van.</p>`,
  words:['la casa = house|home|the house','la ciudad = city|the city','la calle = street|the street','el banco = bank|the bank',
    'la playa = beach|the beach','la escuela = school|the school','el baño = bathroom|toilet|the bathroom|the toilet',
    'aquí = here','allí = there|over there','estoy = I am|I\'m ~ estar','está = he is|she is|it is ~ estar','voy = I go|I\'m going|I am going'],
  sents:['¿Dónde está el baño? = Where is the bathroom?|Where\'s the bathroom?|Where is the toilet?|Where\'s the toilet?',
    'Estoy en casa. = I am at home.|I\'m at home.','El banco está aquí. = The bank is here.',
    'Voy a la playa. = I am going to the beach.|I\'m going to the beach.|I go to the beach.',
    'Vamos al centro. = We are going to the centre.|We\'re going to the centre.|We are going downtown.|We\'re going downtown.|Let\'s go to the centre.|We are going to the center.|We\'re going to the center.',
    'La escuela está cerca. = The school is close.|The school is nearby.|The school is near.'],
  dlg:['Sam: Perdón, ¿dónde está la playa? = Excuse me, where is the beach?',
    'Elena: Está cerca. Siga todo recto. = It\'s close. Go straight ahead.',
    'Sam: ¿Y el banco? = And the bank?',
    'Elena: El banco está allí, a la derecha. = The bank is over there, on the right.',
    'Sam: Muchas gracias. = Thank you very much.',
    'Elena: De nada. = You\'re welcome.'] },

{ id:'tiempo', es:'El tiempo', en:'Days and time', band:'A1',
  tip:`<p>Days and months are not capitalised. <i>El lunes</i> = on Monday; <i>los lunes</i> = on Mondays.</p>
<p>Telling time: <i>Es la una</i>, <i>Son las tres</i>. Add <b>y media</b> (half past), <b>y cuarto</b> (quarter past) or <b>menos cuarto</b> (quarter to).</p>
<p><i>Mañana</i> means both "tomorrow" and "morning": <i>mañana por la mañana</i> = tomorrow morning.</p>`,
  words:['el lunes = Monday|on Monday','el martes = Tuesday|on Tuesday','el miércoles = Wednesday|on Wednesday','el jueves = Thursday|on Thursday',
    'el viernes = Friday|on Friday','el sábado = Saturday|on Saturday','el domingo = Sunday|on Sunday','hoy = today',
    'mañana = tomorrow|morning','ayer = yesterday','la semana = week|the week','¿qué hora es? = what time is it?'],
  sents:['Hoy es lunes. = Today is Monday.','Mañana es sábado. = Tomorrow is Saturday.','¿Qué hora es? = What time is it?',
    'Es la una. = It is one o\'clock.|It\'s one o\'clock.|It is one.|It\'s one.',
    'Son las tres y media. = It is half past three.|It\'s half past three.|It is three thirty.|It\'s three thirty.',
    'Trabajo de lunes a viernes. = I work from Monday to Friday.|I work Monday to Friday.'] },

{ id:'verbos-er-ir', es:'Verbos en -er, -ir', en:'Regular -er and -ir verbs', band:'A2', verbs:['comer|pres','vivir|pres'],
  tip:`<p><b>-er</b> verbs: <b>-o, -es, -e, -emos, -éis, -en</b>. <i>comer → como, comes, come…</i></p>
<p><b>-ir</b> verbs are the same except for nosotros and vosotros: <b>-imos, -ís</b>. <i>vivir → vivimos, vivís</i>.</p>
<p><i>Todos los días</i> = every day.</p>`,
  words:['comer = to eat','beber = to drink','leer = to read','aprender = to learn','vivir = to live','escribir = to write',
    'abrir = to open','aprendo = I learn|I\'m learning|I am learning','vives = you live','escribe = he writes|she writes',
    'leemos = we read','abren = they open'],
  sents:['Aprendo español todos los días. = I learn Spanish every day.|I\'m learning Spanish every day.|I am learning Spanish every day.',
    '¿Dónde vives? = Where do you live?','Vivo en una casa pequeña. = I live in a small house.',
    'Ella escribe una carta. = She writes a letter.|She is writing a letter.|She\'s writing a letter.',
    'Leemos el periódico. = We read the newspaper.|We are reading the newspaper.|We\'re reading the newspaper.',
    'La tienda abre a las nueve. = The shop opens at nine.|The store opens at nine.'] },

{ id:'tener-querer', es:'Tener, querer, poder', en:'Have, want, can', band:'A2', verbs:['tener|pres','querer|pres','poder|pres'],
  tip:`<p>Some verbs change their stem when it's stressed: <b>e → ie</b> (querer: quiero; tener: tienes) and <b>o → ue</b> (poder: puedo). The nosotros form keeps the original stem: <i>queremos, podemos</i>.</p>
<p><b>Tener que</b> + verb = to have to: <i>Tengo que trabajar</i>.</p>
<p>Spanish "has" hunger and thirst: <i>tengo hambre, tengo sed, tengo frío</i>.</p>`,
  words:['tengo = I have','tienes = you have','tiene = he has|she has|it has','tenemos = we have','quiero = I want|I\'d like',
    'quieres = you want|do you want','puedo = I can|can I','puedes = you can|can you','tengo hambre = I\'m hungry|I am hungry',
    'tengo sed = I\'m thirsty|I am thirsty','tengo que = I have to|I must','ahora = now'],
  sents:['Tengo hambre. = I am hungry.|I\'m hungry.','¿Quieres un café? = Do you want a coffee?|Would you like a coffee?',
    'No puedo hoy. = I can\'t today.|I cannot today.','Tengo que trabajar mañana. = I have to work tomorrow.',
    '¿Puedes ayudarme? = Can you help me?','Queremos comer ahora. = We want to eat now.'] },

{ id:'describir', es:'Describir', en:'Describing things', band:'A2',
  tip:`<p>Adjectives usually come after the noun and match it in gender and number: <i>un coche viejo, una casa vieja, unas casas viejas</i>.</p>
<p>Adjectives ending in -e or a consonant only change for plural: <i>grande → grandes</i>, <i>feliz → felices</i>.</p>
<p><b>Ser</b> for what something is like, <b>estar</b> for how it is right now: <i>Es aburrido</i> (he's boring) vs <i>Está aburrido</i> (he's bored).</p>`,
  words:['grande = big|large','pequeño = small|little','bonito = pretty|beautiful|nice','feo = ugly','nuevo = new','viejo = old',
    'caro = expensive','barato = cheap','bueno = good','malo = bad','feliz = happy','cansado = tired'],
  sents:['La casa es grande. = The house is big.|The house is large.','Mi coche es viejo. = My car is old.',
    'Estoy muy cansada. = I am very tired.|I\'m very tired.','Las manzanas son baratas. = The apples are cheap.|Apples are cheap.',
    'Es una ciudad bonita. = It is a pretty city.|It\'s a pretty city.|It is a beautiful city.|It\'s a beautiful city.',
    'Ellos están felices. = They are happy.|They\'re happy.'] },

{ id:'restaurante', es:'En el restaurante', en:'At the restaurant', band:'A2',
  tip:`<p><b>Quisiera</b> is a polite "I would like". <i>Quiero</i> is fine with friends but can sound blunt to a waiter.</p>
<p>Many places in Spain offer a <b>menú del día</b>: a set lunch with a starter, main, dessert and drink at a fixed price.</p>
<p>Get the waiter's attention with <i>Perdone</i> or <i>Disculpe</i>.</p>`,
  words:['la mesa = table|the table','la cuenta = bill|the bill|check|the check','el menú = menu|the menu','el camarero = waiter|the waiter',
    'la comida = food|meal|lunch|the food','la cena = dinner|the dinner','el desayuno = breakfast|the breakfast','delicioso = delicious',
    'quisiera = I would like|I\'d like','¿cuánto cuesta? = how much does it cost?|how much is it?','para mí = for me','la propina = tip|the tip'],
  sents:['Una mesa para dos, por favor. = A table for two, please.','La cuenta, por favor. = The bill, please.|The check, please.',
    'Quisiera la sopa. = I would like the soup.|I\'d like the soup.','Para mí, el pescado. = For me, the fish.|The fish for me.',
    '¿Cuánto cuesta el menú del día? = How much is the set menu?|How much does the set menu cost?|How much is the menu of the day?|How much does the menu of the day cost?',
    'La comida está deliciosa. = The food is delicious.'],
  dlg:['Camarero: Buenas noches. ¿Qué desean? = Good evening. What would you like?',
    'Ana: Quisiera la sopa y el pescado. = I\'d like the soup and the fish.',
    'Camarero: ¿Y para beber? = And to drink?',
    'Ana: Agua, por favor. = Water, please.',
    'Camarero: Muy bien. ¿Algo más? = Very good. Anything else?',
    'Ana: No, gracias. Y después, la cuenta. = No, thanks. And afterwards, the bill.'] },

{ id:'futuro', es:'El futuro', en:'Making plans', band:'A2', verbs:['hacer|pres'],
  tip:`<p>The easiest future: <b>ir a + infinitive</b>. <i>Voy a comer</i> = I'm going to eat.</p>
<p>Put <b>a</b> before a person who receives the action (the "personal a"): <i>Llamo a mi madre</i>.</p>
<p><b>Hacer</b> (to do, to make) is irregular in the yo form: <i>hago</i>.</p>`,
  words:['viajar = to travel','visitar = to visit','comprar = to buy','llamar = to call','ver = to see|to watch','salir = to go out|to leave',
    'voy a = I\'m going to|I am going to','vas a = you\'re going to|you are going to','va a = he\'s going to|she\'s going to|he is going to|she is going to',
    'vamos a = we\'re going to|we are going to|let\'s','la próxima semana = next week','el año que viene = next year'],
  sents:['Voy a viajar a España. = I am going to travel to Spain.|I\'m going to travel to Spain.',
    '¿Qué vas a hacer mañana? = What are you going to do tomorrow?',
    'Vamos a ver una película. = We are going to watch a film.|We\'re going to watch a film.|We are going to watch a movie.|We\'re going to watch a movie.|We are going to see a movie.|We\'re going to see a movie.|We are going to see a film.|We\'re going to see a film.',
    'Ella va a llamar a su madre. = She is going to call her mother.|She\'s going to call her mother.|She is going to call her mum.|She\'s going to call her mum.',
    'La próxima semana voy a comprar un coche. = Next week I am going to buy a car.|Next week I\'m going to buy a car.|I\'m going to buy a car next week.|I am going to buy a car next week.',
    'Vamos a salir esta noche. = We are going to go out tonight.|We\'re going to go out tonight.|We are going out tonight.|We\'re going out tonight.'] },

{ id:'pasado', es:'El pasado', en:'The past tense', band:'B1', verbs:['hablar|pret','comer|pret','ir|pret','hacer|pret','tener|pret'],
  tip:`<p>The <b>preterite</b> is for finished actions at a point in the past: <i>Ayer comí paella</i>.</p>
<p>-ar: <b>-é, -aste, -ó, -amos, -asteis, -aron</b>. -er and -ir: <b>-í, -iste, -ió, -imos, -isteis, -ieron</b>.</p>
<p>The accent changes the meaning: <i>hablo</i> = I speak, <i>habló</i> = he spoke.</p>
<p><b>Ir</b> and <b>ser</b> share the same preterite: <i>fui</i> = I went or I was. Context tells you which.</p>`,
  words:['hablé = I spoke|I talked','comí = I ate','viví = I lived','fui = I went|I was','hice = I did|I made','tuve = I had',
    'compré = I bought','vimos = we saw|we watched','fuimos = we went|we were','anoche = last night',
    'la semana pasada = last week','el año pasado = last year'],
  sents:['Ayer comí paella. = Yesterday I ate paella.|I ate paella yesterday.',
    'Anoche vimos una película. = Last night we watched a film.|Last night we watched a movie.|We watched a movie last night.|We watched a film last night.|Last night we saw a movie.|Last night we saw a film.',
    'Fui a la playa el sábado. = I went to the beach on Saturday.|On Saturday I went to the beach.',
    'La semana pasada compré un libro. = Last week I bought a book.|I bought a book last week.',
    '¿Qué hiciste ayer? = What did you do yesterday?',
    'Viví en Chile dos años. = I lived in Chile for two years.|I lived in Chile two years.'] },

{ id:'gustos', es:'Gustos', en:'Likes with "gustar"', band:'B1',
  tip:`<p><b>Gustar</b> works backwards: <i>Me gusta el café</i> literally means "coffee pleases me".</p>
<p>Use <b>gusta</b> for one thing or an action, <b>gustan</b> for plural things: <i>Me gustan los libros</i>.</p>
<p>The pronouns are <b>me, te, le, nos, os, les</b>. Add <i>a mí, a ti, a mi hermana</i> for emphasis or clarity.</p>
<p>Agreeing: <i>A mí también</i> (me too) after a positive, <i>A mí tampoco</i> (me neither) after a negative.</p>`,
  words:['me gusta = I like','te gusta = you like|do you like','le gusta = he likes|she likes','nos gusta = we like',
    'me encanta = I love','el fútbol = football|soccer','la música = music|the music','los libros = books|the books',
    'bailar = to dance','nadar = to swim','también = also|too','tampoco = neither|either|not either'],
  sents:['Me gusta el café. = I like coffee.','¿Te gusta bailar? = Do you like to dance?|Do you like dancing?',
    'Nos gustan los libros. = We like books.|We like the books.',
    'A mi hermana le encanta nadar. = My sister loves to swim.|My sister loves swimming.',
    'No me gusta el fútbol. = I don\'t like football.|I do not like football.|I don\'t like soccer.|I do not like soccer.',
    'A mí también. = Me too.|Me also.'] },

{ id:'viaje', es:'De viaje', en:'Travel', band:'B1',
  tip:`<p><b>Siga</b>, <b>gire</b> and <b>tome</b> are polite commands you'll hear when asking directions: <i>Gire a la derecha</i> = turn right.</p>
<p>In Spain a ticket is <b>el billete</b>; in most of Latin America it's <b>el boleto</b>.</p>
<p><b>Aquí tiene</b> = here you are (when handing something over).</p>`,
  words:['el aeropuerto = airport|the airport','el billete = ticket|the ticket','el tren = train|the train','el hotel = hotel|the hotel',
    'la habitación = room|the room','la maleta = suitcase|the suitcase','la llave = key|the key','a la derecha = on the right|to the right',
    'a la izquierda = on the left|to the left','todo recto = straight ahead|straight on','cerca = near|close|nearby','lejos = far|far away'],
  sents:['Tengo una reserva. = I have a reservation.|I have a booking.',
    '¿A qué hora sale el tren? = What time does the train leave?|At what time does the train leave?',
    'El hotel está a la izquierda. = The hotel is on the left.','Siga todo recto. = Go straight ahead.|Keep going straight.|Go straight on.',
    '¿Está lejos el aeropuerto? = Is the airport far?|Is the airport far away?','Perdí mi maleta. = I lost my suitcase.'],
  dlg:['Recepcionista: Buenas tardes. ¿En qué puedo ayudarle? = Good afternoon. How can I help you?',
    'Tom: Hola. Tengo una reserva a nombre de Tom Smith. = Hi. I have a reservation under the name Tom Smith.',
    'Recepcionista: Sí, una habitación doble para tres noches. = Yes, a double room for three nights.',
    'Tom: Perfecto. ¿El desayuno está incluido? = Perfect. Is breakfast included?',
    'Recepcionista: Sí, de siete a diez. Aquí tiene la llave. = Yes, from seven to ten. Here is the key.',
    'Tom: Muchas gracias. = Thank you very much.'] }
];

/* Word hints: hover or tap a Spanish word in an exercise to see these.
   Single words go in GLOSS, multi-word phrases in PHRASES (longest phrase wins). */
const PHRASES = {
  'buenos días':'good morning', 'buenas tardes':'good afternoon', 'buenas noches':'good night / good evening',
  'por favor':'please', 'de nada':'you\'re welcome', 'qué tal':'how\'s it going?', 'me llamo':'my name is (lit. I call myself)',
  'te llamas':'your name is (lit. you call yourself)', 'se llama':'is called', 'mucho gusto':'nice to meet you',
  'hasta luego':'see you later', 'muchas gracias':'thank you very much', 'todo recto':'straight ahead',
  'a la derecha':'on the right', 'a la izquierda':'on the left', 'tengo hambre':'I\'m hungry (lit. I have hunger)',
  'tengo que':'I have to', 'menú del día':'set menu of the day', 'todos los días':'every day', 'la semana pasada':'last week',
  'la próxima semana':'next week', 'esta noche':'tonight', 'y media':'half past', 'me gusta':'I like (lit. it pleases me)',
  'me gustan':'I like (plural things)', 'nos gustan':'we like (plural things)', 'te gusta':'you like', 'le encanta':'loves',
  'a mí también':'me too', 'un poco':'a little', 'aquí tiene':'here you are', 'qué hora es':'what time is it?',
  'cuántos años tienes':'how old are you? (lit. how many years do you have)', 'de dónde':'where from',
  'a nombre de':'under the name of', 'en qué':'how / in what way', 'a qué hora':'at what time', 'algo más':'anything else',
  'para mí':'for me', 'voy a':'I\'m going to', 'vas a':'you\'re going to', 'va a':'is going to', 'vamos a':'we\'re going to / let\'s'
};
const GLOSS = {
  a:'to / at', abre:'opens', abuela:'grandmother', aeropuerto:'airport', agua:'water', ahora:'now', al:'to the', algo:'something',
  'allí':'there', alto:'tall', amiga:'friend (female)', amigos:'friends', anoche:'last night', aprendo:'I learn', 'aquí':'here',
  ayer:'yesterday', ayudarle:'help you (formal)', ayudarme:'help me', 'años':'years', bailar:'to dance', banco:'bank',
  baratas:'cheap', 'baño':'bathroom', beber:'to drink', bebo:'I drink', bien:'well / good', bonita:'pretty', buenas:'good',
  bueno:'good', buenos:'good', 'café':'coffee', cansada:'tired', carne:'meat', carta:'letter', casa:'house / home', centro:'centre',
  cerca:'near', cinco:'five', ciudad:'city', coche:'car', cocina:'cooks', come:'eats', comer:'to eat', comida:'food', como:'I eat',
  comprar:'to buy', 'compré':'I bought', 'comí':'I ate', cuenta:'bill', cuesta:'costs', 'cuánto':'how much', 'cuántos':'how many',
  'cómo':'how', de:'of / from', del:'of the', deliciosa:'delicious', derecha:'right', desayuno:'breakfast', desean:'(you all) want',
  'después':'afterwards', diez:'ten', doble:'double', dos:'two', 'día':'day', 'días':'days', 'dónde':'where', el:'the', ella:'she',
  ellos:'they', en:'in / at / on', encanta:'delights (= loves)', encantada:'delighted', eres:'you are', es:'is', escribe:'writes',
  escuchan:'listen', escuela:'school', 'españa':'Spain', 'español':'Spanish', esta:'this', estoy:'I am', estudia:'studies',
  'está':'is', 'están':'are', favor:'favour', felices:'happy', fui:'I went / I was', 'fútbol':'football', gatos:'cats',
  gracias:'thanks', grande:'big', gusta:'pleases (= like)', gustan:'please (= like)', gusto:'pleasure', 'habitación':'room',
  hablas:'you speak', hablo:'I speak', hacer:'to do', hambre:'hunger', hasta:'until', hay:'there is / there are', hermana:'sister',
  hermano:'brother', hermanos:'brothers / siblings', hiciste:'you did', hija:'daughter', hola:'hello', hombre:'man', hora:'hour / time',
  hotel:'hotel', hoy:'today', incluido:'included', 'inglés':'English', izquierda:'left', la:'the', las:'the', le:'to him / to her',
  leemos:'we read', lejos:'far', libro:'book', libros:'books', llama:'calls', llamar:'to call', llamas:'you call', llamo:'I call',
  llave:'key', los:'the', luego:'later', lunes:'Monday', madre:'mother', maleta:'suitcase', manzana:'apple', manzanas:'apples',
  'mañana':'tomorrow / morning', me:'me / myself', media:'half', 'menú':'menu', mesa:'table', mi:'my', mis:'my', muchas:'many',
  mucho:'much / a lot', muy:'very', 'más':'more / else', 'mí':'me', 'música':'music', nada:'nothing', nadar:'to swim',
  no:'no / not', noche:'night', noches:'nights / evening', nombre:'name', nos:'us', nueve:'nine', 'número':'number', padre:'father',
  padres:'parents', paella:'paella (rice dish)', pan:'bread', para:'for', pasada:'last / past', 'película':'film / movie',
  'pequeña':'small', 'perdí':'I lost', 'perdón':'excuse me', perfecto:'perfect', 'periódico':'newspaper', pescado:'fish',
  playa:'beach', poco:'little', por:'for / by', profesora:'teacher (female)', 'próxima':'next', puedes:'you can', puedo:'I can',
  que:'that', queremos:'we want', queso:'cheese', quieres:'you want', quiero:'I want', quisiera:'I would like', 'qué':'what',
  recto:'straight', reserva:'reservation', sale:'leaves', salir:'to go out', se:'himself / herself', semana:'week',
  'señora':'madam / Mrs', siete:'seven', siga:'carry on (polite)', 'simpática':'nice', 'simpático':'nice', somos:'we are',
  son:'are', sopa:'soup', soy:'I am', su:'his / her / their', 'sábado':'Saturday', 'sí':'yes', tal:'such', 'también':'also / too',
  tardes:'afternoons', te:'you / yourself', tengo:'I have', tienda:'shop', tiene:'has', tienes:'you have', todo:'all',
  todos:'all / every', trabajamos:'we work', trabajar:'to work', trabajo:'I work', tren:'train', tres:'three', tu:'your',
  'tú':'you', un:'a', una:'a / one', va:'goes', vamos:'we go / let\'s go', vas:'you go', veinte:'twenty', ver:'to see / to watch',
  viajar:'to travel', viejo:'old', viernes:'Friday', vimos:'we saw', viven:'they live', vives:'you live', vivo:'I live',
  'viví':'I lived', voy:'I go', y:'and', yo:'I', 'él':'he'
};

/* Scroll feed extras. Culture: [title, text]. False friends: [spanish, looks like, really means, example]. */
const CULTURE = [
  ['Two kisses hello', 'In Spain, friends and new acquaintances often greet with <i>dos besos</i>, a light cheek-to-cheek on each side, starting with your right cheek to their right cheek. Men greeting other men usually shake hands instead.'],
  ['Dinner at ten', 'Spaniards eat late. Lunch, the big meal, is often around 2 pm and dinner can be 9 or 10 pm. A restaurant may be empty at 7 pm and full at 10.'],
  ['Sobremesa', '<i>La sobremesa</i> is the time spent chatting around the table after a meal is finished. There is no single English word for it, which says something about the culture.'],
  ['Where "tapa" comes from', '<i>Tapa</i> means "lid" or "cover". A popular story says bars once covered drinks with a slice of bread or ham to keep flies out, and the snack took the name.'],
  ['¡Ojalá!', '<i>Ojalá</i> means "I hope so" or "if only". It comes from Arabic, roughly "if God wills", a trace of the centuries of Moorish rule in Spain. Thousands of Spanish words have Arabic roots.'],
  ['Words from Arabic', 'Many Spanish words starting with <i>al-</i> come from Arabic: <i>almohada</i> (pillow), <i>azúcar</i> (sugar), <i>aceite</i> (oil), <i>alcalde</i> (mayor).'],
  ['Vale', 'In Spain you will hear <i>vale</i> constantly. It means "OK" or "sounds good": <i>¿Quedamos a las ocho? — Vale.</i>'],
  ['¿Mande?', 'In Mexico, if you didn\'t hear someone, a polite reply is <i>¿Mande?</i>, meaning "pardon?". In Spain people usually say <i>¿Cómo?</i> or <i>¿Perdón?</i>'],
  ['Ahorita', 'In Mexico <i>ahorita</i> literally means "right now", but it can mean anything from "this second" to "sometime later". Context and tone tell you which.'],
  ['Upside-down marks', 'The opening <b>¿</b> and <b>¡</b> warn you a question or exclamation is coming, which matters because Spanish word order often doesn\'t change for questions: <i>¿Tienes hambre?</i> vs <i>Tienes hambre.</i>'],
  ['Days named after planets', 'Most weekdays come from the planets and Roman gods: <i>lunes</i> (Moon), <i>martes</i> (Mars), <i>miércoles</i> (Mercury), <i>jueves</i> (Jupiter), <i>viernes</i> (Venus).'],
  ['Castellano or español?', 'Both names are correct. <i>Castellano</i> (Castilian) is common in Spain and parts of South America, where it separates it from other languages of Spain like Catalan, Galician and Basque.'],
  ['Vosotros on the map', '<i>Vosotros</i> (you all, informal) is used almost only in Spain. In Latin America, <i>ustedes</i> covers every group of "you", formal or not.'],
  ['The biggest Spanish-speaking country', 'Mexico has more Spanish speakers than any other country, far more than Spain. The United States also has tens of millions of Spanish speakers.'],
  ['La Tomatina', 'On the last Wednesday of August, the town of Buñol near Valencia holds <i>La Tomatina</i>, a huge street fight where thousands of people throw ripe tomatoes at each other.'],
  ['Día de Muertos', 'In Mexico, <i>Día de Muertos</i> (1–2 November) honours loved ones who have died, with altars called <i>ofrendas</i>, marigold flowers, photos and their favourite foods.'],
  ['The Camino de Santiago', 'Pilgrims have walked the <i>Camino de Santiago</i> for centuries to Santiago de Compostela in Galicia. Today many walk it for the scenery, the people and the challenge.'],
  ['Guiri', 'Spaniards jokingly call foreign tourists <i>guiris</i>. It\'s usually friendly teasing, especially for anyone sunburnt in sandals and socks.'],
  ['Tú or usted?', 'Use <i>usted</i> with older people, officials and in formal service. In Spain, people switch to <i>tú</i> quickly, so if someone uses <i>tú</i> with you, it\'s fine to do the same.'],
  ['Buenas', 'A casual all-purpose greeting is just <i>¡Buenas!</i>, short for <i>buenas tardes</i> or <i>buenos días</i>. You\'ll hear it walking into shops and bars.'],
  ['The Real Academia', 'The <i>Real Academia Española</i>, founded in 1713, publishes the official dictionary and spelling rules. Its motto is <i>Limpia, fija y da esplendor</i>: "it cleans, fixes and gives splendour".'],
  ['Spanish sounds out loud', 'Spanish is very phonetic: once you know the rules, you can pronounce almost any word you read. Unlike English, the vowels always keep the same sound.']
];
const FALSE_FRIENDS = [
  ['embarazada', 'embarrassed', 'pregnant', 'Mi hermana está embarazada.'],
  ['constipado', 'constipated', 'having a cold', 'Estoy constipado, no puedo salir.'],
  ['éxito', 'exit', 'success', 'La película fue un gran éxito.'],
  ['librería', 'library', 'bookshop', 'Compré un libro en la librería.'],
  ['carpeta', 'carpet', 'folder', 'Los papeles están en la carpeta.'],
  ['sensible', 'sensible', 'sensitive', 'Es una persona muy sensible.'],
  ['actual', 'actual', 'current', 'El presidente actual es joven.'],
  ['realizar', 'to realise', 'to carry out', 'Vamos a realizar un proyecto.'],
  ['asistir', 'to assist', 'to attend', 'Voy a asistir a la reunión.'],
  ['molestar', 'to molest', 'to bother', 'No quiero molestar.'],
  ['ropa', 'rope', 'clothes', 'Tengo mucha ropa.'],
  ['once', 'once', 'eleven', 'Son las once.']
];

/* Daily five. Word of the day: [spanish, english, example, example in English]. */
const WORD_DAY = [
  ['la sobremesa','time chatting at the table after a meal','Nos quedamos de sobremesa dos horas.','We stayed chatting at the table for two hours.'],
  ['madrugar','to get up early','Mañana tengo que madrugar.','Tomorrow I have to get up early.'],
  ['el mercado','market','Compro fruta en el mercado.','I buy fruit at the market.'],
  ['la merienda','afternoon snack','La merienda es a las seis.','The afternoon snack is at six.'],
  ['disfrutar','to enjoy','¡Disfruta tu viaje!','Enjoy your trip!'],
  ['quizás','maybe, perhaps','Quizás vamos mañana.','Maybe we\'ll go tomorrow.'],
  ['el sobrino','nephew','Mi sobrino tiene cinco años.','My nephew is five years old.'],
  ['aprovechar','to make the most of','Hay que aprovechar el sol.','You have to make the most of the sun.'],
  ['la madrugada','the early hours (after midnight)','Llegamos a las tres de la madrugada.','We arrived at three in the morning.'],
  ['el atasco','traffic jam','Hay un atasco en la autopista.','There\'s a traffic jam on the motorway.'],
  ['ahorrar','to save (money)','Quiero ahorrar para un coche.','I want to save for a car.'],
  ['el cumpleaños','birthday','¡Feliz cumpleaños!','Happy birthday!'],
  ['la sombra','shade, shadow','Vamos a la sombra.','Let\'s go into the shade.'],
  ['charlar','to chat','Me gusta charlar con mis amigos.','I like chatting with my friends.'],
  ['el fin de semana','weekend','¿Qué haces el fin de semana?','What are you doing at the weekend?'],
  ['despacio','slowly','Habla más despacio, por favor.','Speak more slowly, please.'],
  ['tener sueño','to be sleepy','Tengo mucho sueño.','I\'m really sleepy.'],
  ['probar','to try, to taste','¿Quieres probar la paella?','Do you want to try the paella?'],
  ['olvidar','to forget','No olvides las llaves.','Don\'t forget the keys.'],
  ['la plaza','town square','Quedamos en la plaza.','Let\'s meet in the square.'],
  ['quedar','to meet up','¿Quedamos a las ocho?','Shall we meet at eight?'],
  ['el vecino','neighbour','Mi vecino es muy amable.','My neighbour is very kind.'],
  ['amable','kind','Gracias, eres muy amable.','Thanks, you\'re very kind.'],
  ['por fin','at last','¡Por fin es viernes!','At last it\'s Friday!'],
  ['la ola','wave (at sea)','Las olas son grandes hoy.','The waves are big today.'],
  ['el gasto','expense','Tengo muchos gastos este mes.','I have a lot of expenses this month.'],
  ['acordarse','to remember','No me acuerdo de su nombre.','I don\'t remember his name.'],
  ['tranquilo','calm, relaxed','Tranquilo, no pasa nada.','Relax, it\'s no big deal.'],
  ['el viaje','trip, journey','¡Buen viaje!','Have a good trip!'],
  ['el consejo','piece of advice','Te doy un consejo.','Let me give you some advice.']
];
/* Real life: [situation, spanish, english, tip]. */
const PRACTICAL = [
  ['Emergency','¡Ayuda! Llame a una ambulancia.','Help! Call an ambulance.','In Spain and across the EU, the emergency number is 112.'],
  ['When you\'re lost','Perdone, me he perdido. ¿Me puede ayudar?','Excuse me, I\'m lost. Can you help me?','"Perdone" is the polite way to stop a stranger.'],
  ['When you don\'t understand','No entiendo. ¿Puede repetir, por favor?','I don\'t understand. Can you repeat that, please?','Add "más despacio" (more slowly) if they speak fast.'],
  ['Asking for English','¿Habla inglés?','Do you speak English?','Try a few words of Spanish first. People appreciate the effort.'],
  ['At the pharmacy','¿Tiene algo para el dolor de cabeza?','Do you have something for a headache?','Spanish pharmacies have a green cross sign and the staff give good advice.'],
  ['Allergies','Soy alérgico a los frutos secos.','I\'m allergic to nuts.','Say "alérgica" if you\'re a woman.'],
  ['Paying by card','¿Puedo pagar con tarjeta?','Can I pay by card?','Card is accepted almost everywhere, but small bars may prefer cash.'],
  ['Getting the bill','¿Me cobra, por favor?','Can I pay, please?','In Spain the waiter won\'t bring the bill until you ask for it.'],
  ['At the station','Un billete de ida y vuelta a Madrid, por favor.','A return ticket to Madrid, please.','"Solo ida" means one way.'],
  ['Opening hours','¿A qué hora abre la tienda?','What time does the shop open?','Many small shops in Spain close for a few hours in the afternoon.'],
  ['Seeing a doctor','Necesito un médico. Me duele aquí.','I need a doctor. It hurts here.','Point to where it hurts while you say "aquí".'],
  ['Writing it down','¿Me lo puede escribir, por favor?','Can you write it down for me, please?','Handy for addresses, prices and names.'],
  ['At the hotel','La ducha no funciona.','The shower doesn\'t work.','Swap in anything: "El aire acondicionado no funciona".'],
  ['Booking a table','Quería reservar una mesa para cuatro a las nueve.','I\'d like to book a table for four at nine.','"Quería" (I wanted) is a soft, polite way to ask.'],
  ['Asking the way','¿Cómo llego a la estación?','How do I get to the station?','"¿Cómo llego a…?" works for anywhere.'],
  ['Taxi','Lléveme a esta dirección, por favor.','Take me to this address, please.','Show the address on your phone as you say it.'],
  ['Shopping','¿Tiene esto en otra talla?','Do you have this in another size?','"Más grande" is bigger, "más pequeña" is smaller.'],
  ['Wi-Fi','¿Cuál es la contraseña del wifi?','What\'s the Wi-Fi password?','Spaniards say "wifi" like "wee-fee".'],
  ['Saying sorry','Lo siento, ha sido sin querer.','Sorry, I didn\'t mean to.','"Perdón" is for small bumps; "lo siento" is a real apology.'],
  ['Making friends','¿Te apetece tomar algo?','Do you fancy getting a drink?','"Tomar algo" is the classic casual invitation.']
];
/* Sayings and quotes: [spanish, literal English, meaning, source or null]. */
const DICHOS = [
  ['Poco a poco se va lejos.','Little by little, you go far.','Slow, steady progress gets you there.', null],
  ['Caminante, no hay camino, se hace camino al andar.','Traveller, there is no road; the road is made by walking.','You make your own path by moving forward.','Antonio Machado'],
  ['El que lee mucho y anda mucho, ve mucho y sabe mucho.','The one who reads much and walks much, sees much and knows much.','Reading and travel make you wise.','Miguel de Cervantes, Don Quijote'],
  ['Más vale tarde que nunca.','Better late than never.','The same as the English saying.', null],
  ['En boca cerrada no entran moscas.','Flies don\'t get into a closed mouth.','Sometimes it\'s wiser to stay quiet.', null],
  ['No hay mal que por bien no venga.','There\'s no bad that doesn\'t come with some good.','Every cloud has a silver lining.', null],
  ['Dime con quién andas y te diré quién eres.','Tell me who you walk with and I\'ll tell you who you are.','You\'re judged by the company you keep.', null],
  ['A quien madruga, Dios le ayuda.','God helps whoever gets up early.','The early bird catches the worm.', null],
  ['Más vale pájaro en mano que ciento volando.','A bird in the hand is worth more than a hundred flying.','Value what you already have.', null],
  ['Camarón que se duerme, se lo lleva la corriente.','The shrimp that falls asleep gets swept away by the current.','Stay alert or you\'ll miss out.', null],
  ['Ojos que no ven, corazón que no siente.','Eyes that don\'t see, heart that doesn\'t feel.','What you don\'t know can\'t hurt you.', null],
  ['El que no arriesga, no gana.','Whoever doesn\'t risk doesn\'t win.','Nothing ventured, nothing gained.', null],
  ['Ser pan comido.','To be eaten bread.','To be a piece of cake: very easy.', null],
  ['Estar en las nubes.','To be in the clouds.','To be daydreaming.', null],
  ['Tomar el pelo.','To take someone\'s hair.','To pull someone\'s leg.', null],
  ['Costar un ojo de la cara.','To cost an eye from your face.','To cost an arm and a leg.', null],
  ['Echar una mano.','To throw a hand.','To lend a hand.', null],
  ['Al mal tiempo, buena cara.','To bad weather, a good face.','Keep smiling when things go wrong.', null]
];
