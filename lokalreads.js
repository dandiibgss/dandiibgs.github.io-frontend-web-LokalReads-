/* =====================================================================
   LokalReads - Lapisan Data Bersama (Shared Data Layer)
   ---------------------------------------------------------------------
   File ini adalah SATU SUMBER KEBENARAN untuk seluruh website.
   Semua halaman memanggil objek global `LR` untuk membaca / menulis
   data buku, review, statistik baca, rekomendasi, dan sesi login.

   Semua data disimpan di localStorage sehingga tetap ada walau halaman
   di-refresh (tidak butuh backend).

   Kunci localStorage yang dipakai:
     - lr_books          : daftar SEMUA buku (seed + unggahan penulis)
     - lr_reviews        : daftar semua rating & review
     - lr_reads          : { [bookId]: [email pembaca unik...] }
     - registeredUsers   : daftar akun terdaftar (dipakai login/daftar)
     - currentUser       : akun yang sedang login
   ===================================================================== */
(function (global) {
  "use strict";

  var KEYS = {
    books: "lr_books",
    reviews: "lr_reviews",
    reads: "lr_reads",
    seeded: "lr_seeded_v3",
    users: "registeredUsers",
    current: "currentUser",
    /* --- lapisan pengalaman membaca (baru) --- */
    favorites: "lr_favorites", // { [uid]: [bookId, ...] }
    wishlist: "lr_wishlist", // { [uid]: [bookId, ...] }
    progress: "lr_progress", // { [uid]: { [bookId]: {lastPage,totalPages,percent,status,updatedAt} } }
    ownership: "lr_ownership", // { [uid]: { [bookId]: 'preview'|'rented'|'owned' } }
    challenge: "lr_challenge", // { [uid]: { year, target } }
    history: "lr_history", // { [uid]: [ {bookId, action, at} ] }
  };

  /* Daftar genre resmi (dipakai onboarding, kategori, form upload) */
  var GENRES = [
    "Fiksi",
    "Non-Fiksi",
    "Bisnis",
    "Self-Help",
    "Sejarah",
    "Biografi",
    "Kuliner",
    "Teknologi",
    "Religi",
    "Seni",
  ];

  var GENRE_ICONS = {
    Fiksi: "📖",
    "Non-Fiksi": "📚",
    Bisnis: "💼",
    "Self-Help": "✨",
    Sejarah: "📜",
    Biografi: "👤",
    Kuliner: "🍳",
    Teknologi: "💻",
    Religi: "🙏",
    Seni: "🎨",
  };

  /* Profil Penulis bawaan */
  var AUTHOR_PROFILES = {
    "Fadilah Karsono": {
      name: "Fadilah Karsono",
      photo: "foto/fadilah-karsono-bacapetra.webp",
      bio: "Fadilah Karsono. Lahir tahun 1992. Sekarang tinggal di pedalaman Cilacap, Jawa Tengah. Pernah aktif menulis cerpen dan esai di website kintaka.co yang kebetulan sudah tutup sejak 2019. Pernah berkolaborasi menulis lima cerpen dengan seorang rekan komunitas Rumah Budaya Akar di Kairo menerbitkan buku kumpulan cerita Orang-orang Kairo akhir tahun 2019. Kesibukan sekarang mengajar di sebuah SMP swasta, membaca buku dan sedang menyelesaikan sebuah novel."
    },
    "Ajen Angelina": {
      name: "Ajen Angelina",
      photo: null,
      bio: "Penulis asal Nusa Tenggara Timur yang aktif berkarya di berbagai media sastra. Karya-karyanya kerap mengangkat dinamika kehidupan sosial dan kebudayaan daerah."
    },
    "Baron Yudo Negoro": {
      name: "Baron Yudo Negoro",
      photo: null,
      bio: "Penulis fiksi dan esais asal Jawa Timur. Berpengalaman menulis cerita bernuansa sejarah lokal, mistisisme, dan relasi manusia dengan alam."
    },
    "Yin Ude": {
      name: "Yin Ude",
      photo: null,
      bio: "Penulis fiksi sejarah Indonesia yang aktif menelusuri kisah-kisah perjuangan dan konflik masa lampau melalui narasi yang kuat."
    }
  };

  function getAuthorProfile(authorName) {
    if (!authorName) {
      return {
        name: "Penulis Anonim",
        photo: null,
        bio: "Penulis lokal yang berkontribusi di LokalReads."
      };
    }
    var nameTrimmed = authorName.trim();
    if (AUTHOR_PROFILES[nameTrimmed]) {
      return AUTHOR_PROFILES[nameTrimmed];
    }
    return {
      name: nameTrimmed,
      photo: null,
      bio: "Penulis lokal yang berkontribusi di LokalReads dengan karya-karya bergenre fiksi dan non-fiksi. Menghadirkan cerita yang dekat dengan keseharian pembaca Indonesia."
    };
  }


  /* ------------------------------------------------------------------
     SEED BOOKS — katalog awal. Untuk buku bawaan, id == judul agar
     tautan lama (?id=<judul>) tetap berfungsi.
     ------------------------------------------------------------------ */
  var SEED_BOOKS = [
    {
      id: "Keputusan Vero",
      judul: "Keputusan Vero",
      penulis: "Ajen Angelina",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2026/03/2603-07-Keputusan-Vero-Cerpen-Ajen-Angelina.webp",
      sinopsis:
        "Tiga tahun ditinggal suami merantau dan merawat mertua yang lumpuh, Vero sampai pada satu titik di mana ia harus mengambil keputusan yang akan mengubah seluruh hidupnya.",
      isi: `<p>Vero menggerus tumitnya dengan batu gosok, menekan sekuat tenaga agar kulit-kulit kasar yang pecah itu kembali halus, atau bila perlu, lenyap tak berbekas. Biasanya ia tak pernah peduli, tetapi Sabtu lalu Frans bilang bagian paling seksi dari perempuan Manggarai adalah tumit mereka.</p>
<p>Kalimat itu menyusup ke dalam tidurnya, menghantui sejak semalam. Bahkan saat ia terbangun dan mengganti popok Endé Bina pagi tadi, gema suara Frans bukannya mereda, malah berdengung makin kencang. Begitu kencang hingga aroma pesing yang menyengat seolah tak tercium oleh hidungnya.</p>
<p>Ia berhenti menggosok tumitnya. Tangannya gemetar sesaat sebelum melempar batu gosok itu ke lantai kamar mandi, mengeluarkan bunyi dentum yang cukup keras. Tiga tahun lalu suaminya, Nadus, merantau ke Kalimantan, meninggalkannya terikat pada mertua yang lumpuh bagian kanan akibat stroke sejak lima tahun lalu. Sejak Nadus pergi, baru kali ini ia tidak segera menepis kata-kata seorang lelaki.</p>
<p>Ia buru-buru menyudahi mandinya. Begitu melangkah keluar, matahari bulan Mei yang garang langsung menyergap. Jarak pendek dari kamar mandi ke pintu rumah cukup untuk membuat kulitnya yang basah dingin berubah lengket.</p>
<p>Di dalam kamar, ia menggosokkan tawas ke ketiak—keras dan lama—seraya menatap pantulan tubuh polos miliknya di cermin lemari. Buah dadanya menggantung bagai mangga ranum yang jika tak dipetik akan diincar kalong buah. Tubuhnya melekuk sempurna dengan perut rata.</p>
<p>“Andaikan aku dan Frans bertemu sepuluh tahun lalu, mungkin ceritanya berbeda,” desahnya.</p>
<p>Ia menepis pikiran itu dan segera mengenakan daster. Ia merapikan rambut sebelum keluar menuju ruang tengah. Cahaya matahari menerobos masuk melalui pintu depan dan jendela yang terbuka. Jam di dinding ruang tamu menunjukkan pukul dua siang. Ia berdiri cukup lama memandang jam itu dan baru beranjak ketika mendengar erangan dari kamar di bagian ujung kanan, dekat dapur.</p>
<p>Di kamar itu, Endé Bina terkapar lemah di ranjang beralaskan perlak, tanpa kelambu. Tubuhnya kurus, seolah-olah tak pernah ada lemak di sana. Aroma minyak urut yang menusuk bercampur dengan pesing samar-samar menguar. Cahaya matahari dari jendela kamar tak mampu mengusir suram di ruangan itu.</p>
<p>“Endé, ada apa?”</p>
<p>Perempuan itu terus mengerang, matanya tertutup. Vero mengecek sarung dan mendapati popok perempuan itu kering. Mungkin ia mimpi buruk, batin Vero.</p>
<p>“Vero… Vero… di mana Nadus?”</p>
<p>Perempuan tua di hadapannya terlihat makin menyedihkan. Akhir-akhir ini ia sering mencari anak bungsu kesayangannya itu, seolah anaknya tak pernah berpamitan padanya tiga tahun lalu. Sebulan ini mertuanya lebih banyak tidur, padahal sebelumnya ia selalu bisa duduk di tempat tidur meski lemah.</p>
<p>Vero berdiri lama di sisi ranjang, tanpa tahu di mana harus meletakkan tangannya.</p>
<p>Sepuluh tahun lalu saat ia dan suaminya menikah, mertuanya itu masih baik-baik saja: cekatan menanam talas di kebun samping rumah, terampil menganyam tikar di bale-bale, dan berapi-api menceritakan banyak hal pada Vero. Ia perempuan tua yang kuat, sendirian menghidupi tiga orang anaknya sebagai penganyam tikar. Meski ia tak pernah bisa membaca, ketiga anak laki-lakinya lulus SMA dan telah merantau mendapat kerja baik di luar kampung.</p>
<p>Endé Bina memiliki aura tenang dan penuh kasih. Vero masih ingat bagaimana perempuan itu menerima saja ketika anaknya memperkenalkan istri yang masih remaja ingusan dan tak jelas asal-usulnya sepuluh tahun lalu. Selain itu selama sepuluh tahun menikah, saat menantunya itu tak kunjung hamil, mertuanya selalu menjadi tameng ketika warga kampung bergunjing. Setiap kali melihat tubuh itu terbaring, napas Vero terasa pendek dan berat.</p>
<p>“Vero… Di mana Nadus?” Perempuan tua itu kembali bertanya lirih. Kelopak matanya yang keriput perlahan terbuka. Bola matanya yang keruh menatap Vero dengan tatapan nanar.</p>
<p>“Nadus sebentar lagi akan datang, Ende,” jawab Vero, sengaja mengalihkan pandangan ke arah jendela.</p>
<p>Ende Bina tidak menjawab. Ia menutup kembali matanya. “Kalau ia datang, bangunkan saya.”</p>
<p>Vero mengangguk, mematung di sudut tempat tidur, dan baru keluar setelah mertuanya tertidur pulas.</p>
<p>Ia menuju dapur, menyalakan tungku dan menjerang air. Pikirannya melayang pada Frans, kepala tukang yang mengerjakan rumah Marta, tetangga yang berjarak tiga rumah dari tempatnya. Laki-laki itu semacam oase yang muncul di hidupnya yang kering. Frans muncul tiga bulan lalu di depan rumahnya, meminta labu siam di kebun belakang untuk lauk ia dan anak buahnya.</p>
<p>“Marta sudah menyediakan sayur yang banyak untuk kami, tetapi nafsu makan anak buah saya seperti babi,” ujarnya malu-malu saat itu.</p>
<p>Laki-laki itu berusia akhir 30-an. Badannya besar dan berotot. Tangannya kasar dan kuat. Ia punya wajah seperti banyak lelaki Manggarai: hitam, pesek, dan berambut keriting. Hanya saja, senyumnya membuat matanya bersinar.</p>
<p>Vero hanya tersenyum dan menyerahkan seember labu siam. Keesokan harinya laki-laki itu kembali. Kali ini membawa ikan kering dari kampungnya sebagai ucapan terima kasih atas labu yang ia berikan. Setelah itu, setiap malam Minggu Frans akan bertamu, biasanya bersama salah satu anak buahnya.</p>
<p>Namun Sabtu lalu—tepat tujuh hari yang lalu—laki-laki itu datang sendiri. Mereka berdua duduk di dapur. Vero merebus sayur untuk makan malam Endé Bina sebelum mertuanya itu minum obat wajib dari Puskesmas. Frans duduk di sampingnya. Mereka berdua menghadap tungku api.</p>
<p>“Pekerjaan kami selesai minggu ini dan minggu depan aku akan pulang, Vero,” ujar Frans. Nada suaranya berubah serius. Padahal sebelumnya mereka membahas hal-hal remeh, seperti lelucon tentang tumit perempuan Manggarai itu.</p>
<p>Vero yang sedang memasukkan kayu bakar ke dalam tungku memandangnya sekilas. Laki-laki itu berdehem sebelum melanjutkan.</p>
<p>“Selama ini aku selalu datang ke rumahmu membawa seorang anak buahku karena aku menghargaimu, Vero.” Ia menatap mata Vero lekat-lekat. “Marta selalu bilang kau perempuan baik-baik dan aku tak boleh macam-macam.”</p>
<p>Ia seketika terdiam. Vero merasakan dadanya bergemuruh.</p>
<p>“Aku tidak mungkin main-main tentangmu, tentang kita. Waktu melihatmu pertama kali, aku langsung jatuh hati. Karena itu, Vero… kaburlah bersamaku.”</p>
<p>Bunyi panci yang bergoyang karena gelembung air mendidih menyentak Vero kembali ke dapur. Dadanya terasa sesak. Ia menelan ludah berkali-kali.</p>
<p>Ia, kalau boleh jujur, sudah lupa pada sentuhan lelaki dan sibuk merawat Endé Bina selama ini. Selain itu suaminya, Nadus, semakin menjauh dan mulai jarang ia pikirkan. Selama tiga bulan ini ia selalu menantikan kunjungan Frans di hari Sabtu. Selama tujuh hari ini ia terus memikirkan kunjungan terakhir. Apakah Frans serius ingin mengajaknya kabur?</p>
<p>Wajah Marta muncul di benaknya, lengkap dengan nada suaranya dua hari lalu.</p>
<p>“Frans serius denganmu, Vero. Ia laki-laki baik. Sudah dua tahun ia menduda.” Mereka duduk di ruang tengah. Awalnya Vero merasa aneh mengapa perempuan itu harus datang menjelaskan tentang Frans yang hanyalah tukang itu.</p>
<p>“Frans itu sepupuku. Kami sekampung. Di kampung ia terkenal baik, tak pernah macam-macam. Saya jamin,” ujar Marta. Vero memandangi Marta waktu itu tanpa benar-benar tahu harus percaya atau tidak.</p>
<p>“Frans itu laki-laki yang tak pernah melakukan sesuatu sembarangan, apalagi mengajak perempuan kawin lari. Ia begitu karena kamu. Ia serius. Kau mau ikut bersamanya, kan?”</p>
<p>“Entahlah, Marta,” desahnya saat itu.</p>
<p>“Buat apa kau tinggal di rumah ini? Anak-anak kandung Endé Bina saja tak ada yang mau merawat. Sudah lima tahun kau hidup sengsara seperti ini, Vero. Kau masih muda, jangan layu dan menjadi tua di tempat ini!” Marta terus mencerca, seolah menyiram bensin pada api yang baru menyala.</p>
<p>Vero hanya mendesah dan duduk di kursi, meminta Marta menurunkan volume suaranya. “Endé Bina itu sudah tak sadar lagi, Vero,” bisik Marta tajam. “Dia bahkan tak tahu ketiga anaknya meninggalkan dia padamu yang orang asing.”</p>
<p>Ende Bina bukanlah orang asing, Vero ingin mengungkapkan itu tetapi urung melihat mata Marta yang berkilat-kilat.</p>
<p>Marta mendekatkan wajahnya, menatap Vero lekat. “Apa yang kau takutkan? Frans itu duda, anaknya tiga. Dia tidak mengharapkan anak lagi darimu yang mandul. Jika itu yang kau takutkan.”</p>
<p>Dada Vero teriris mendengar kata mandul. Sudah lama sekali ia tak mendengar orang lain mengatakan itu terang-terangan. Dulu, Endé Bina memarahi siapa saja yang mengatainya mandul.</p>
<p>“Menantuku tetap perempuan meski belum hamil. Kalian urus saja menantu kalian yang kurang ajar,” amuk mertuanya suatu kali pada sekelompok perempuan tua yang menggunjing namanya. Sejak itu, tak ada yang berani menyebut mandul di depan ia dan Ende Bina.</p>
<p>“Lagipula,” sambung Marta, suaranya melunak tetapi penuh racun, “apa kau yakin Nadus di Kalimantan sana tak punya istri lagi? Laki-laki itu butuh pelayanan, Vero. Tiga tahun dia tidak pulang, apa kau percaya dia tidur sendirian?”</p>
<p>Ia ingin menjawab bahwa ia tak sendirian. Nadus suaminya itu selalu menelepon dan mengirim uang yang cukup untuk beli popok Ende Bina dan keperluan lain. Dua anak laki-laki Ende Bina yang merantau ke Papua dan bekerja di sana juga tidak lepas tangan; sesekali mereka menelepon dan tidak pernah absen mengirim uang setiap bulan. Uang untuk popok, obat, beras, dan bahkan untuk dirinya sendiri selalu ada. Ia tidak kekurangan meski, setiap Sabtu sore, ia selalu mendamba langkah kaki Frans di halaman.</p>
<p>“Kasihan Endé Bina, Mar” ujarnya lemah.</p>
<p>“Lalu bagaimana dengan kau?” sergah Marta cepat. “Apa kau tidak kasihan dengan dirimu sendiri?”</p>
<p>Suara tutupan panci kembali terdengar, kali ini lebih keras. Ia cepat-cepat mengeluarkan beberapa kayu dari tungku, lalu mengisi termos. Suara air yang memenuhi termos terdengar nyaring di telinganya, mengingatkannya pada ucapan terakhir Frans, Sabtu lalu di dapur ini, sebelum pergi.</p>
<p>“Vero, aku menunggu jawabanmu. Sabtu depan, datanglah ke rumah Marta. Kalau kau muncul sebelum pukul tujuh malam, artinya kau setuju untuk pulang bersamaku ke kampungku,” ujar laki-laki itu sebelum mencium keningnya. “Aku janji akan memberikanmu rumah yang lebih baik dari ini. Rumah bersama anak-anakku yang membutuhkan Ibu.”</p>
<p>Lamunannya buyar saat suara erangan Endé Bina kembali terdengar. Vero menepuk kedua pipinya sendiri untuk menyadarkan diri, lalu melangkah menuju kamar mertuanya. Jam dinding di ruang tengah menunjukkan pukul lima sore.</p>
<p>Aroma busuk menyengat menguar memenuhi udara. Dengan sigap, Vero kembali ke dapur mengambil ember dan sabun. Ia mengganti popok sekali pakai yang penuh kotoran dan menyeka seluruh bokong perempuan itu. Mata Ende Bina terbuka saat Vero sedang menyeka bagian belakang tubuhnya.</p>
<p>“Vero, pasti bau sekali kotoranku itu.”</p>
<p>Tanpa sadar Vero tertawa kecil. “Namanya juga kotoran, Endé. Mana ada yang wangi.”</p>
<p>Ia melanjutkan pekerjaannya, membungkus popok kotor itu ke dalam plastik. Ia kembali ke kamar Endé Bina dengan kain lap, sabun, dan ember berisi air hangat, lalu melap seluruh tubuh mertuanya dengan pelan sebelum kemudian memasang popok baru.</p>
<p>“Vero… Kasihan sekali kau, Nak.” Tiba-tiba perempuan tua itu menangis. Ia meraih tangan Vero dan meremasnya dengan sisa tenaganya yang lemah. Sorot matanya mendadak bening, seolah-olah seluruh kabut pikunnya luruh saat itu juga.</p>
<p>“Kau boleh pergi, Vero. Kau masih muda dan tidak layak membusuk bersamaku di sini. Pergilah bersama Frans itu.”</p>
<p>Vero terkesiap. Rupanya Ende Bina mendengar percakapannya dengan Marta beberapa hari lalu. Ia tidak mampu menjawab. Lidahnya kelu.</p>
<p>“Akan lebih baik kalau kau pergi daripada membersihkan kotoranku setiap hari.”</p>
<p>Vero terdiam. Matanya berkaca-kaca. Pikirannya terlempar ke enam tahun lalu, setahun sebelum mertuanya terkena stroke. Saat itu akhirnya ia hamil, tetapi mengalami keguguran ketika usia kandungan baru dua bulan. Ende Bina dengan tubuh tua dan lelahnya yang mengurusinya; menyuapkan ia makan, membersihkan gumpalan darah yang keluar dari tubuhnya yang tak berdaya, dan mencuci bersih seprai serta bajunya yang amis. Tak sekali pun keluar nada jijik atau marah dari mulutnya. Ia membelai kepala Vero dan membisikkan kata-kata pengharapan, bahwa semua akan baik-baik saja, ia tidak sendiri. Itu adalah hal yang hanya mereka berdua ketahui.</p>
<p>Ia juga masih ingat di tahun kelima pernikahan mereka, saat Nadus memarahinya dan memaki-makinya mandul, perempuan tua dengan tubuh ringkih itu memukul anak kandung kesayangannya dengan sapu, membuat suaminya tak pernah lagi macam-macam.</p>
<p>Bahkan seminggu setelah Nadus ke Kalimantan, mertuanya itu memanggilnya dengan suara bergetar. Ia menyuruh Vero membuka laci lemari paling bawah dan mengambil bungkusan di balik tumpukan baju lama. Ada uang sepuluh juta rupiah di sana—hasil tabungan anyaman tikar selama bertahun-tahun.</p>
<p>“Pergilah, Vero. Biarkan anak-anakku membayar seseorang untuk merawatku. Pergilah,” katanya waktu itu, memaksa Vero menerima uang itu untuk memulai hidup baru.</p>
<p>Namun Vero tak pernah mengambil uang itu. Ia tak tahu harus ke mana. Baginya, Endé Bina adalah rumahnya.</p>
<p>Tanpa sadar air mata Vero menetes, jatuh di atas tangan keriput yang sedang menggenggam tangannya erat. Ia menoleh ke arah jendela kamar yang mulai gelap. Di luar sana, jalan menuju rumah Marta dan pelukan Frans terbentang terbuka. Namun, Vero merasakan tumitnya justru mencengkeram erat lantai semen yang dingin di rumah ini.</p>
<p>“Ende, saya siapkan makan, ya,” ujar Vero seraya berdiri, mengalihkan pembicaraan.</p>
<p>Ende Bina tidak menjawab, hanya menatapnya dengan mata berkaca-kaca. Vero melangkah cepat keluar dan mematung di ruang tengah. Jam dinding di atas kepalanya menunjukkan tepat pukul tujuh lewat lima. [*]</p>`,
    },
    {
      id: "Singa Putih",
      judul: "Singa Putih",
      penulis: "Baron Yudo Negoro",
      authorEmail: null,
      genre: "Sejarah",
      img: "https://www.bacapetra.co/wp-content/uploads/2026/02/2602-17-Singa-Putih-Baron-Yudo-Negoro.webp",
      sinopsis:
        "Seorang anak dan bapaknya hidup berdua di sebuah kampung Jawa Timur. Sang bapak terus berbicara tentang singa putih di hutan — pertanda yang konon mendahului datangnya malaikat maut.",
      isi: "<p>Ini ketiga kalinya. Dua tahun silam–kali pertama, Bapak membicarakan singa putih lewat telepon dan kemungkinan datangnya malaikat maut yang, menurut keyakinannya sendiri, bersiap untuk menjemputnya. Aku telah lama menganggap singa putih dongeng belaka. Tapi, karena Bapak sering batuk sepanjang percakapan, aku memutuskan mengambil cuti dan membawa anak-istri pulang ke kampung, yang ternyata hanya untuk mendapati Bapakku kangen cucu.</p><p>Kini, yang menelepon bukan Bapak, melainkan Ridho, kawan sekampungku dulu. Ia mengatakan bahwa akhir-akhir ini Bapak menjalani hari-harinya dengan menyedihkan, terbaring di kasur saja, tubuhnya menyusut sampai menyerupai batang lidi. Aku menanggapi sebagaimana orang menanggapi hujan mendadak.</p><p>“Kau tahu, yang kedua kalinya, dia cuma mau mengajakku memancing di tambak. Percayalah, paling cuma demam biasa. Kemungkinan terburuk, tipes,” kataku.</p><p>“Katanya, aku yang harus bicara padamu. Suaramu tak ramah kalau dia yang bicara. Kau tahu, dia melihat singa putih. Seminggu sebelumnya!” kata Ridho.</p><p>“Masih saja membicarakan itu,” kataku. “Baiklah. Akan kubicarakan dulu dengan Ratri.”</p><p>Setelah percakapan terputus, aku melangkah ke kamar putriku, Alin, dan mengintip sejenak. Ratri istriku telah memeluknya dalam tidur yang damai. Aku menutup pintu perlahan dan menuju sofa, berniat melanjutkan serial televisi yang telah kutetapkan akan kutamatkan malam itu. Namun niat itu batal sebab aku tak bisa berhenti memikirkan Bapak.</p><p>“Ah!” gerutuku, sambil mematikan televisi dan melemparkan remot ke sudut sofa.</p><p>Setelah sekian lama, mengapa omong kosong itu kembali diungkit, pikirku, sambil menggaruk kepala. “Singa putih,” kataku pada diri sendiri, lalu terkekeh singkat.</p><p style=\"text-align: center;\">***</p><p>Kau tahu, Pembaca Budiman, sejak Ibuku meninggal, aku dan Bapak hidup berdua di sebuah kampung di Jawa Timur, di rumah berdinding bata yang berdiri tak jauh dari sungai, hutan, dan perbukitan. Bapak, yang mulanya dikenal sebagai pengajar ngaji, pengisi khotbah Jumat, dan pengumandang azan, lambat laun mengubah ruang tamu kami menjadi tempat orang-orang menumpahkan keluh kesah. Mereka pulang dengan lega, meninggalkan “amplop”. Dengan cara itulah ia menghidupi kami.</p><p>Semua bermula dari pengakuannya yang menggemparkan kampung: bahwa ia, dengan mata kepala sendiri, telah melihat sosok singa putih di hutan. Tak seorang pun tahu, apakah makhluk itu tak kasat mata, atau singa sungguhan dengan taring tajam dan selera yang tak pilih-pilih, termasuk mengoyak daging manusia.</p><p>“Tidak berbahaya. Yang penting, kita sama-sama saling jaga,” kata Bapak suatu malam, kepada bapak-bapak yang dituakan di kampung kami.</p><p>Usiaku enam tahun kala itu, dan aku mengintip dari balik jendela saat mereka duduk bersila di teras rumah, beralaskan tikar, menyimak Bapak dengan keseriusan rapat negara. Dan maksud dari “saling menjaga”, kupahami di kemudian hari.</p><p>Aku ingat duduk di bak pikap, menjaga tunas-tunas pohon yang diborong dari kota, sementara Bapak menyetir. Setibanya di lapangan kampung, warga menyalami dan mencium tangannya, menurunkan tunas-tunas itu, lalu berbondong-bondong membawanya ke hutan. Bapak memanjatkan doa, mereka mengamini, dan bersama-sama menanam pohon-pohon muda itu. Pada minggu-minggu tertentu, mereka bahkan mendaki bukit, membersihkan reruntuhan lumpur dan bebatuan dari sungai kecil.</p><p>Kami pernah menyusuri hutan berdua. Kami memunguti ranting-ranting dan dahan mati, memindahkannya ke jalan setapak. Rasa heran mendorongku bertanya, untuk apa semua ini dilakukan.</p><p>“Dia tidak suka jejak manusia,” kata Bapak. “Kau lihat saja. Air bersih, udara segar, tanah subur. Bahkan sumur kita tak pernah kering. Kau kira itu ulah siapa? Ya, singa putih. Karena itu kita harus jaga rumahnya,” sambungnya.</p><p style=\"text-align: center;\">***</p><p>Aku percaya sepenuhnya. Bagaimanapun, usiaku baru delapan tahun. Pengetahuan apa yang kumiliki untuk menolak keyakinan itu? Namun, Pembaca Budiman, izinkan aku mengatakan bahwa luka pertamaku justru tumbuh dari kepercayaan kenaifan itu.</p><p>Sekolahku terletak jauh dari kampung, harus menyusuri sungai hingga ke jalan utama kota, lalu menaiki bus ke utara. Aku satu-satunya murid yang menempuh perjalanan serepot itu. Pada suatu hari, ejekan teman-temanku tak lagi tertuju pada sepatu butut, seragam lusuh, atau tasku yang ditambal kain. Dan semua bermula dari satu pertanyaan dari guru kami. “Siapa pahlawanmu?”</p><p>Sementara murid lain menyebut ayah, ibu, atau kerabat dekat mereka, aku menanti giliranku dengan harapan yang ternyata terlampau tinggi. Aku berniat menyebut singa putih. Dalam imajiku, aku berdiri, menerangkan alasannya, dan melihat mereka yang selama ini mengejekku mengangguk-angguk kagum. Namun, semua tak seperti yang kubayangkan.</p><p>Tawa mereka meledak. Beberapa terpingkal sampai terjungkal ke belakang, sebagian melonjak-lonjak di bangku, memukul-mukul meja seperti kera liar, dan remasan kertas beterbangan ke arahku. Seorang murid bahkan beringsut hanya untuk mendorong kepalaku dari belakang.</p><p>“Kembali ke tempat dudukmu!” teriak guruku.</p><p>Di bangku, duduk sendiri, aku menahan diri untuk tidak menjatuhkan martabatku dengan meneteskan air mata. Namun, Pembaca Budiman, dadaku bergetar aneh. Seperti kepanasan. Seolah-olah ada api di dalamnya. Dan saat aku mengira mereka telah selesai denganku, mendadak seorang murid semacam menyadari siapa aku.</p><p>“Oh, aku tahu. Kau anaknya Pak Karmin, bukan?”</p><p>“Pak Karmin?” Murid lain mengernyit.</p><p>“Karmin Kampung Waru!”</p><p>“Yang dukun itu?”</p><p>Sejak itulah mereka memanggilku “Karmin”, “Dukun”, atau “Singa Putih”.</p><p>Jika kau bernasib lebih mujur, semisal anak orang berada, kau mungkin merengek ke bapakmu, memohon dipindahkan ke sekolah lain. Tapi, aku bukanlah kau. Aku anak dari Pak Karmin. Sialnya lagi, setelah enam tahun kulalui dengan murung dan terasing, aku kembali bertemu bocah-bocah yang sama di SMP dan SMA. Mereka menyebarkan kisahku, menertawakannya lagi dan lagi sambil bergurau, “Hati-Hati, dia ahli santet.” Atau, “Hati-Hati, dia ahli pelet.”</p><p>Pernah suatu ketika kesabaranku habis. Mereka mencemoohku di kantin. Tanpa pertimbangan, kulemparkan sambal soto, sehingga seorang di antaranya menjerit-jerit karena matanya bagai terbakar, dan merasa perlu membenamkan kepala ke ember penuh air. Seorang memukulku, aku membalas, kami pun berguling-guling di samping kantin, di tanah berlumpur yang lengket dan bau.</p><p>Aku pulang membawa oleh-oleh berupa sepucuk amplop–Bapak dipanggil karena pertengkaranku. Aku terpelanting oleh tamparannya.</p><p>“Memalukan,” katanya sambil meremas surat itu.</p><p>Darahku mendidih.</p><p>Mungkin karena aku beranjak dewasa. Mungkin karena aku terlampau lama menelan semuanya sendiri. Leherku menegang, rahangku mengeras, dan otot-otot tanganku mengencang.</p><p>“Bapak yang memalukan. Yang Bapak lakukan, semua omong kosong itu, semua memalukan,” kataku. Aku lalu menutup pintu, tak membiarkan seluruh dunia masuk ke kamarku.</p><p>Sore berikutnya, Bapak menghampiriku. Ia meminta maaf dan mengatakan bahwa ia tahu apa yang menimpaku selama ini; seorang tetangga, katanya, memiliki keponakan yang selalu satu sekolah denganku.</p><p>“Ada sedikit tabungan,” katanya dengan lembut dan sorot mata redup. “Setelah SMA, kau bisa ke Surabaya.”</p><p>Aku merasakan penyesalan mendalam darinya. Namun, tahun-tahun berat yang kulalui rasanya terlampau mahal untuk ditebus dengan cara seperti itu.</p><p>Memang, aku merasa lega saat kuliah di Surabaya. Setahun sekali aku pulang, itu pun dua hari saat Lebaran. Setelah lulus, aku bekerja di perusahaan swasta, bertemu Ratri, dan menjalin hubungan serius. Namun, ketika Bapak bertemu orang tua Ratri di Surabaya dan membicarakan singa putih, aku meninggalkan meja makan tanpa berkata-kata karena merasa sangat malu. Ratri menyusulku.</p><p>“Kau mestinya bangga, Raf,” kata Ratri.</p><p>“Ya. Bangga. Tentu saja aku bangga,” kataku. “Bapakku pembohong dan aku sangat bangga!”</p><p>Itulah luka yang kuniatkan sebagai luka terakhirku.</p><p style=\"text-align: center;\">***</p><p>Hari-hari berikutnya, Ridho kerap menelepon, tetapi tak satu pun kujawab. Aku tahu maksudnya, membicarakan kondisi Bapak, memintaku pulang hanya untuk mendapati urusan-urusan remeh. Hingga suatu sore, sepulang kerja, kudapati Ratri duduk di bangku kayu teras dengan tangan tersilang. Ia menatapku seperti menatap seorang musuh.</p><p>“Aku ditelepon,” katanya. “Kita harus pulang kampung.”</p><p>“Oh.</p><p>“Bapak kritis. Kau bahkan tak tanya siapa yang meneleponku.”</p><p>“Ridho, bukan.”</p><p>“Dokter!”</p><p>“Itu Ridho.”</p><p>Ratri bangkit dengan kasar hingga kaki bangku berderit. “Kalau kau tak mau pulang kampung, biar aku dan Alin sendiri.”</p><p>Aku memanggilnya, tetapi ia telah masuk ke rumah. Maka, tanpa pilihan lain, aku menuruti maunya. Kami pun berkemas-kemas, berangkat malam itu juga. Sepanjang perjalanan, Ratri diam dalam kemarahannya, sementara Alin bermain ponsel di bangku tengah.</p><p style=\"text-align: center;\">***</p><p>“Ratri, tunggu,” kataku, tetapi ia terus melangkah masuk ke rumah.</p><p>Tentu saja, aku tak punya pilihan selain menuruti Ratri. Kami pun berkemas-kemas, kemudian berangkat malam itu juga dengan mobil.</p><p>Semestinya aku berhak marah, tetapi Ratri tampak sangat geram. Sepanjang perjalanan, ia membisu dalam kemarahannya, sementara Alin hanya bermain ponsel di bangku tengah.</p><p>Menjelang pagi, saat kami baru sampai di Situbondo, kabar duka datang: Bapak telah tiada dan akan dimakamkan keesokan harinya. Ratri menangis terisak, berkali-kali mengusap air mata, menggumamkan kalimat, “Kau akan dihantui penyesalan.”</p><p>Aku menunggu datangnya kesedihan. Namun yang muncul hanyalah perasaan asing dari bagian dalam diriku yang telah lama padam. Ratri tak mungkin mengerti bagaimana menjadi orang yang hidup tanpa ibu, menanggung kebohongan bapaknya, tersisih, dijauhi, dan dikucilkan hanya karena siapa bapaknya.</p><p>Kami mengikuti seluruh prosesi pemakaman. Aku ikut menggotong keranda, sebagaimana Ratri minta, dan berniat pergi sebelum malam. Angin membuat bambu berderap dan dedaunan berguguran, sementara kerudung putih Ratri berkibar. Ia berjongkok dan menabur bunga, sementara aku hanya berdiri di samping Alin yang menatap entah ke mana.</p><p>Usia Alin sembilan tahun, tumbuh dengan kecantikan paras seperti ibunya. Dan ia terus menatap entah ke mana.</p><p>“Kenapa, Sayang?” tanyaku sambil berjongkok.</p><p>Lalu, Alin mengangkat tangan dan menunjuk jauh ke arah hutan. Aku pun mengernyit, melihat sesuatu.</p><p>“Ada singa putih, Pa,” katanya. [*]</p>",
    },
    {
      id: "Sulis dalam Tiga Babak",
      judul: "Sulis dalam Tiga Babak",
      penulis: "Fadilah Karsono",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2026/02/2602-07-Sulis-dalam-Tiga-Babak-Fadilah-Karsono.webp",
      sinopsis:
        "Kisah Sulis, seorang ibu yang rela melakukan apa pun demi anaknya, terbagi dalam tiga babak kehidupan yang penuh kejutan dan luka.",
      isi: `<p>Pagi itu, di luar rutinitas memberi makan ayam dan membersihkan kotoran mereka, Sulis mengarahkan mesin cukur yang menyala ke rambut kepala sekolah anaknya. Desing mesin di atas kepala yang tak berdaya memanggil-manggil dan menimbulkan keributan di kantor kecil itu. Salah seorang guru berpakaian olahraga menangkap Sulis dari belakang dan menariknya dengan cepat. Hentakannya membuat kepala sekolah yang sedari tadi diam mengaduh. Tidak jelas, disebabkan pisau mesin cukur mengenai kulit kepalanya atau rambutnya tercabut. Sulis tidak memberontak dan hanya berdiri mematung setelah guru tadi meminta mesin cukur dari tangannya dan mematikannya. Kepala sekolah dengan rambut tercukur acak terdiam seribu bahasa. Kedua matanya menatap Sulis tak percaya.</p>
<p>“Untuk anakku.”</p>
<p>Sulis berkata tajam sebelum berbalik badan dan pergi meninggalkan pria paruh baya yang malang itu. Kepala sekolah mengangkat tangan saat gestur si guru berpakaian olahraga hendak mencegah Sulis pergi. “Biarkan,” katanya sembari mengusap-usap kepalanya, membuang rambut-rambut terpotong yang masih menempel. Guru berpakaian olahraga mengangguk dan mendekat seolah ingin membantu tapi tak tahu harus bagaimana. Guru-guru lain yang sejak tadi berkerumun di luar ruangan, berbisik-bisik satu sama lain, hanya bergeser membuka celah kerumunan dengan sukarela agar Sulis bisa lewat. Tak ada yang berusaha menenangkan, tak ada yang mengajak bicara, Sulis hilang di antara deru motor yang terburu-buru. Para pegawai tampaknya masih belum bisa mencerna apa yang baru saja terjadi. Beberapa orang mulai memasuki ruangan kepala sekolah dan menanyakan keadaan atasan mereka itu, juga apa yang ia butuhkan saat ini.</p>
<p>“Cari tahu siapa dia!”</p>
<p>Seorang guru wanita mendekat dan mengatakan bahwa ia mengetahui siapa gerangan orang yang telah berani mencukur paksa atasannya. Katanya lagi, anak dimaksud ibu tadi adalah satu-satunya siswa yang dihukum cukur plontos oleh kepala sekolah dua hari yang lalu setelah upacara. Sebuah nama disebutkan dan melihat raut wajahnya, memori kepala sekolah tampak sedang berulang dalam kepalanya. Guru tadi juga manambahkan bahwa siswa tersebut sudah tidak masuk sejak dihukum sampai hari ini. Siswa itu meninggalkan sekolah sebelum jam berakhir, kabarnya pulang ke rumah yang jaraknya sekitar 100 meter saja dari sekolah. Kepala sekolah menarik napas panjang dan menghembuskannya perlahan. Matanya terpejam sesaat. Kemudian ia meminta para guru kembali ke ruangan mereka dan tidak usah meributkan apa yang sudah terjadi.</p>
<p>“Sebisa mungkin anak-anak lain jangan sampai tahu, apalagi orang-orang di luar sana. Sekolah kita adalah yang terbaik di sepanjang pantai timur,” katanya. “Dan juga…pinjamkan saya topi. Saya mau ke tukang cukur dulu.”</p>
<p>Kepala sekolah beranjak dari kursinya sembari mengibas-ngibaskan tangan pada kemejanya dan berjalan menuju lorong kantor. Sebagian guru tidak mematuhi perintahnya, mereka memasuki ruangan kepala sekolah berbekal sapu dan kemoceng lalu membersihkan sisa-sisa potongan rambut yang tersebar di lantai, kursi, dan perabot lain. Kepala sekolah sempat berhenti menoleh tapi tidak lama dan melanjutkan berjalan menuju pintu keluar sampai ke parkiran guru dalam diam. Ia menyapa dengan senyum beberapa siswanya yang berpapasan di rute menuju kendaraannya. Setelah sampai di samping sepeda motornya ia mengambil ponsel dari saku celana dan menelepon sebuah nomor. Kepala sekolah berbicara dengan tenang, entah dengan siapa.</p>
<p style="text-align: center;">***</p>
<p style="text-align: center; font-weight: bold;">2</p>
<p>“Betul nama ibu Sulis?”</p>
<p>“Betul.”</p>
<p>“Silakan duduk.”</p>
<p>…..</p>
<p>“Ibu tahu kenapa ibu dipanggil ke sini?”</p>
<p>“Dibawa.”</p>
<p>“Maaf?”</p>
<p>“Dibawa. Bukan dipanggil.”</p>
<p>“Mohon maaf karena ibu tidak kooperatif. Kami terpaksa—”</p>
<p>“Dibawa. Seperti barang…”</p>
<p>“Ibu Sulis, dengan segala hormat, mohon lihat rekaman cctv ini.”</p>
<p>“Saya tahu apa yang saya lakukan.”</p>
<p>“Berarti ibu Sulis mengakui perbuatan ibu?”</p>
<p>“Harus saya jawab?”</p>
<p>“Harus, bu.”</p>
<p>“Dengan segala hormat saya mengakui perbuatan saya sebagaimana sudah sangat jelas terlihat pada rekaman cctv.”</p>
<p>“Kami tidak bermaksud merendahkan…kami wajib memastikan orang yang ada pada rekaman itu adalah ibu.”</p>
<p>“Kenapa baru dilakukan sekarang? Kenapa tidak sebelum anda menangkap dan membawa paksa saya, di hadapan semua orang?”</p>
<p>“Ibu…ibu bisa dipenjara setidaknya enam bulan.”</p>
<p>“Saya akan melaporkan balik. Dengar ya, saya akan laporkan balik!”</p>
<p>“Kenapa tidak ibu jelaskan dulu sekarang? Mengapa ini semua terjadi dan mengapa ibu melakukannya. Saya akan mendengarkan.”</p>
<p>“Anda sudah tahu.”</p>
<p>“Ibu harus mengucapkannya. Ibu tahu kita direkam, kan?”</p>
<p>“Direkam? Kenapa?”</p>
<p>“Kewajiban kami, bu.”</p>
<p>“Kenapa tidak bilang di awal?”</p>
<p>“Ah, maafkan saya. Apakah ibu keberatan kami merekam—?”</p>
<p>“Sudah, sudah.”</p>
<p>“Lalu?”</p>
<p>“Orang itu lebih dulu mencukur anak saya sampai plontos! Siapa dia merasa berhak menyentuh anak saya?”</p>
<p>“Orang itu adalah kepala sekolah anak ibu.”</p>
<p>“Apa itu menjadikan dia boleh mencukur rambut anak kecil yang jelas-jelas telah menolak untuk dicukur? Hanya karena telat satu hari merapikan rambutnya anak saya harus ditertawakan satu sekolahan?”</p>
<p>“Saya paham ibu…”</p>
<p>“Tidak, anda tidak paham. Harusnya yang anda interogasi saat ini adalah orang itu!”</p>
<p>“Tentu ada prosedur yang harus kami lalui…”</p>
<p>“Prosedur anda salah! Saya sudah melapor ke dinas, juga ke kantor ini, sama sekali tidak ada tindak lanjut.”</p>
<p>“IBU!”</p>
<p>…..</p>
<p>“Anda tidak akan pernah bisa…melaporkan orang itu.”</p>
<p>“Saya…saya..”</p>
<p>“Ibu harus kami tahan.”</p>
<p>“Bagaimana dengan anak saya..”</p>
<p>“Anak ibu akan—”</p>
<p>“Berhenti berkata ‘anak ibu’, ‘anak ibu’! Dia juga anak anda!”</p>
<p>……</p>
<p>……</p>
<p>“Sulis…”</p>
<p style="text-align: center;">***</p>
<p style="text-align: center; font-weight: bold;">3</p>
<p>Enam jam setelah ditahan di Polsek, Sulis keluar dengan muka muram. Tidak ada satu petugas pun yang ia sapa. Ia hanya keluar begitu saja setelah mengambill barang-barangnya. Di luar, kepala sekolah tampak menunggunya, berdiri sendiri di halaman Polsek yang temaram. Petang telah datang.</p>
<p>Kepalanya yang plontos terekspos begitu saja di udara yang dingin. Sulis sempat memerhatikan sesaat kemudian menatap mata kepala sekolah yang sudah berada di hadapannya. Katanya, ayo bicara. Yang ditanya hanya diam saja sementara kepala sekolah bergerak menuju mobilnya dan membukakan pintu penumpang sebelah kemudi. Sulis akhirnya juga bergerak mendekat dan mengisyaratkan dengan tangannya agar dibukakan pintu kursi belakang. Kepala sekolah mengiyakan dan tak lama mobilnya telah melaju di jalan besar meninggalkan Kantor Polsek di belakang mereka.</p>
<p>Tak sampai sepuluh menit mereka tiba di sebuah rumah makan. Segera kepala sekolah mengajak Sulis menuju salah satu meja dan mempersilakannya duduk di kursi.</p>
<p>“Saya tidak lapar dan tidak haus,” ucap Sulis sebelum orang di hadapannya berbicara apa-apa.</p>
<p>“Tentu. Setidaknya biarkan saya memesan sesuatu.” Kepala sekolah mengangkat tangannya berusaha menarik perhatian salah seorang pelayan di situ. Sulis hanya diam.</p>
<p>“Saya ingin bicara baik-baik.” Setelah berhasil memesan kepala sekolah membuka lagi pembicaraan mereka.</p>
<p>“Saya tidak ingin. Saya hanya ingin pulang, kasihan anak saya sendiri di rumah. Lagipula saya tidak bawa hape,” jawab Sulis.</p>
<p>“Anak ibu baik-baik saja. Dia bersama ayahnya. Sebelum ke Polsek saya sempat menemuinya.”</p>
<p>“Dia tidak baik-baik saja. Apalagi anda menemuinya.” Sulis kini menatap kepala sekolah, tajam dan marah. “Saya dan ayahnya sudah berpisah karena dia tidak baik kepada anak saya. Anda harus bertanggung jawab apabila terjadi apa-apa.”</p>
<p>“Kalau begitu saya tidak tahu mesti berkata apa lagi.” Kepala sekolah menghela napas. “Saya sudah membantu anda.”</p>
<p>“Membantu apa?”</p>
<p>“Keluar dari sel. Ibu kira siapa yang menebus ibu?”</p>
<p>“Tapi anda juga yang memasukkan saya ke dalam penjara.”</p>
<p>“Itu adalah respon kesadaran saya yang paling sadar pada waktu itu. Saya juga dirugikan di sini.” Tiba-tiba kepala sekolah menggelengkan kepalanya yang tampak ringan itu, seperti tak percaya apa yang telah menimpanya.</p>
<p>“Latur bagaimana dengan anak saya?”</p>
<p>“Anak anda tidak bagaimana-bagaimana. Dia sedang dididik. Saya yang mendidiknya.”</p>
<p>Mata Sulis berkaca-kaca. “Dengan menyentuhnya? Memaksa mencukur rambutnya?”</p>
<p>“Jika itu diperlukan.”</p>
<p>“Anda tahu? Yang anda lakukan adalah penganiayaan terhadap anak!” Suara Sulis meninggi. Air matanya mengalir.</p>
<p>Kepala sekolah tampak panik dan memberi isyarat agar Sulis tetap tenang. Dan merespons dengan suara yang berat dan berbisik, “Saya sudah cukup bersabar. Saya tidak tahu apa lagi yang anda inginkan.”</p>
<p>“Saya sudah sampaikan tadi. Saya hanya ingin pulang. Jadi biarkan saya pulang sekarang.” Sulis berdiri saat seorang pelayan mendekat membawa satu nampan makanan dan minuman. Sulis menunggunya selesai menata dan pergi kemudian berkata, “Nikmati malam anda. Semoga Tuhan membalas anda seburuk-buruknya.”</p>
<p>Turun dari motor ojek, Sulis mendapati anaknya sedang terduduk menangis sendiri di teras rumah. Samar-samar tampak kepalanya yang plontos tersinari lampu lima watt yang remang-remang. Ia langsung memeluknya dan bertanya ada apa, di mana ayahnya. Anak itu menangis semakin kencang dan hanya memberi gelengan sebagai jawaban. Sulis mengajak anaknya masuk. Di dalam rumah semua pintu terbuka sampai ke pintu belakang, ke arah kandang ayam milik Sulis. Bersama anaknya memegangi bajunya, Sulis menemukan kandang ayam yang menjadi sumber mata pencahariannya porak poranda. Tak ada satupun ayam terlihat atau kokoknya terdengar. Di kepala Sulis, tak ada wujud atau suara apa pun malam itu. [*]</p>`,
    },
    {
      id: "Mata-Mata",
      judul: "Mata-Mata",
      penulis: "Yin Ude",
      authorEmail: null,
      genre: "Sejarah",
      img: "https://www.bacapetra.co/wp-content/uploads/2026/01/2601-17-Mata-Mata-Cerpen-Yin-Ude.webp",
      sinopsis:
        "Di tengah perang melawan Belanda, Mayor Hasan menyadari rencananya telah bocor. Pengkhianat itu mungkin justru orang yang paling ia percaya.",
      isi: `<p>Langit hitam, hitam sekali di mata Mayor Hasan. Padahal langit malam ini sama dengan langit malam kemarin, malam sananya, sebelum-sebelumnya: cerah karena purnama. Dan bintang-bintang jelas berkelap-kelip putih. Tapi seperti itu pula, ketika menatap nyala api unggun yang dikelilingi prajuritnya, ia melihat gulita.</p>
<p>Angin menusuk tubuhnya lewat sela seragamnya. Lalu ia yang sedang tegak di jendela barak itu menghela nafas berat. Wajah kecewa komandan batalyon menamparnya. Kolonel itu telah meremehkannya juga.</p>
<p>“Bagaimana Belanda sampai tahu rencanamu, Hasan?” cecarnya kemarin.</p>
<p>Dari balik gulita yang sesungguhnya, di antara dua barak prajurit ia melihat Kapten Mulyo datang.</p>
<p>Langkah lelaki muda itu tangkas dan tegap, menunjukkan sifatnya yang berani dan percaya diri.</p>
<p>Belakangan Hasan semakin meyakini sifat bawahannya itu setelah dua minggu lalu Kapten Mulyo memimpin penyerangan gudang militer Belanda. Pasukannya berhasil merebut banyak sekali senjata beserta amunisi.</p>
<p>“Sudah dapat?”</p>
<p>Belum sampai sang kapten masuk, Mayor Hasan sudah menyambut dengan pertanyaan.</p>
<p>Kapten menabik, tegas, tapi lengannya kemudian turun dengan lesu. Suaranya lirih, “Semua prajurit telah diperiksa. Barak disisir untuk menemukan petunjuk. Kesimpulan saya tak ada antek Belanda di kompi kita, yang membocorkan rencana penyergapan kemarin.”</p>
<p>Maka komandan kompi kembali ke jendela dan batinnya mendapati api unggun telah padam di tengah lingkaran prajurit yang sedang mengusir dingin dengan nyalanya.</p>
<p>“Bagaimana rencana kita menerima masuknya laskar wanita?”</p>
<p>Mayor menoleh. Sinis. Lalu memerhatikan tiga petugas medis wanita yang sedang bercengkerama di dekat barak medis. Tak pernah ia biarkan senjata di gudang kompi disentuh kaum itu. Setiap melihat mereka menyentuh gagang senapan, tatapan Hasan langsung melembing. Ketika ia menyaksikan tangan-tangan lembut mereka melipat perban atau menggotong tandu, Hasan yakin, memang itulah mereka adanya.</p>
<p>“Tidak!” jawabnya.</p>
<p>“Di luar sana kaum wanita juga ditakuti Belanda, Mayor…” Wakil itu masih menyanggah komandannya.</p>
<p>“Kembali saja selidiki mata-mata dalam pasukan! Itu lebih berguna,” potong Hasan.</p>
<p>Tabik Mulyo menutup sedikit mukanya yang kecut, tapi membesi.</p>
<p>Cahaya lampu teplok memapar wajah Mayor Hasan yang memberengut. Berulang ia menghela nafas, menggeleng-geleng saat dinding menjelma layar.</p>
<p>Adegan demi adegan penyergapan yang ia susun membakar hatinya.</p>
<p>Angin siang yang kering menyambut peleton Letnan Satu Suwarno. Tiga puluh laki-laki berwajah tegang merayap naik ke punggung bukit timur. M1 Carbine Para, Arisaka, Owen Gun hingga hanya bambu runcing di tangan dan dekapan mereka. Sang komandan menggenggam erat pistol Nambu type 94. Ilalang yang tinggi melindungi gerakan peleton lain di bawah pimpinan Letnan Dua Pujo. Mereka telah menguasai punggung bukit barat. Matahari musim kemarau menyorot pagar prajurit timur dan barat itu yang siap tempur.</p>
<p>Pagar itu menunggu konvoi kendaraan tentara Belanda yang menuju selatan, melewati jalan di bawah mereka. Mayor Hasan dan Kapten Mulyo bersama pasukan pemukul, peleton Letnan Satu Arif yang juga telah sedia, bersiap menyerang untuk menutup jalan mundur. Akan segera terjadi: Belanda terdesak terus ke selatan, tak bisa menghindari takdir buruk di jembatan yang telah hancur setelah diledakkan anggota kompi.</p>
<p>Tak berkedip Mayor Hasan mengawasi jalan yang menjadi pusat perhatian seluruh prajurit. Sten Gun-nya telah ia sandarkan ke batu besar di depannya, dengan moncong mengarah ke jalan itu. Ia tersenyum, membayangkan musuhnya tersudut di titik buntu. Di sampingnya, Kapten Mulyo berulang kali menarik nafas. Gemuruh dadanya menanti waktu baku tembak.</p>
<p>Setengah jam waktu berjalan.</p>
<p>“Lama sekali. Apakah sudah benar kerja intelijen kita?” Panas udara memicu keringat di tubuh Kapten Mulyo. Ia gerah. Menjadi tak sabar.</p>
<p>Mayor Hasan tersenyum. Memberi semangat pada wakilnya itu tanpa kata.</p>
<p>Tapi Mulyo menarik nafas, menghembuskannya dengan hentakan.</p>
<p>“Tenang, Kapten. Menunggu untuk kemenangan memang membosankan.” Mayor berucap lembut.</p>
<p>Hampir dua jam. Kapten Mulyo memutar badan, terlentang. Matanya terpejam karena tak sanggup menentang matahari. Tubuh-tubuh prajurit lain mulai lunglai. Karena lelah menanti dan ketegangan tanpa ujung. Seandainya sudah baku tembak, ketegangan itu akan menemukan jalan pelampiasan.</p>
<p>Mayor Hasan mengangkat teropong, mendapati di kejauhan pasukan barat dan timur juga semakin banyak yang merebahkan diri.</p>
<p>“Sampaikan kepada semua pasukan, istirahat, tapi tetap waspada.”</p>
<p>Perintah itu mengharuskan Kapten Mulyo segera mengangkat SCR-300 dari ransel prajurit komunikasi di sampingnya.</p>
<p>Dua jam.</p>
<p>Kapten Mulyo terus memandang komandannya. Mayor Hasan sedang berdoa.</p>
<p>“Telik sandi datang!”</p>
<p>Bisikan Mulyo menghentikan khusyuknya Hasan.</p>
<p>Kahar, telik sandi terengah-engah datang melapor, “Belanda memutar lewat utara, menjauhi area penyergapan!”</p>
<p>Muka komandan kompi sontak memerah…</p>
<p>Mayor Hasan tersentak. Langkah kaki seseorang merenggut dirinya dari lamunan. Sarina, tukang masak sekaligus tukang pijatnya masuk membawa nampan berisi mug penuh kopi.</p>
<p>Sementara perempuan muda itu meletakkan bawaannya di meja, Hasan sudah membuka kemejanya dan tengkurap di tikar di tengah ruang. Begitu selalu, Sarina sudah mengerti tugasnya tanpa diperintah.</p>
<p>Setengah jam kemudian Sarina pergi. Licin minyak pijat tersisa di tikar. Mayor pun menyekanya dengan sehelai sapu tangan dengan bordiran bunga tulip. Itu milik sang perempuan yang tertinggal.</p>
<p>“Ah, perempuan, enaknya memijat. Makin tak kupercaya menggenggam senapan!” bisiknya, melecehkan, seraya mengangkat mug kopi.</p>
<p>Tapi jauh di dalam hatinya, terbetik keinginannya menjadikan gadis itu isteri ketiga.</p>
<p>“Akan kusampaikan besok lusa,” batinnya.</p>
<p>Sebagai komandan, ia gengsi terburu-buru sebab baru dua minggu lebih Sarina tiba di barak, setelah ia “melamar” kerja lewat perempuan medis.</p>
<p>“Ingin membantu perjuangan sebagai tukang masak dan tukang pijat,” katanya saat kali pertama datang.</p>
<p style="text-align: center;">***</p>
<p>Kuning cahaya obor membentuk bayangan Sarina yang duduk di balai-balai depan barak perempuan. Ia menatapinya. Matanya segera menumbuk hitam masa lalunya.</p>
<p>Ibunya tegak di pintu kamar.</p>
<p>“Perempuan tak perlu sekolah. Buka jendela itu, lihat di luar, bunga di tangkai, menunggu kumbang tanpa berulah!”</p>
<p>Seruannya dengan segera memancang jeruji di ambang.</p>
<p>Riuh cengkerama remaja-remaja pria di teras, di jalan-jalan, di langit-langit mimpinya yang ia tatapi dalam sepi. Dadanya gemuruh. Dan yang paling petir adalah senda gurau nona-nona Belanda di sebuah sekolah, ketika ia di belakang sekolah itu, memetik kangkung empang, untuk belajar memasak brambang asem, yang dikatakan ibu bapaknya, “Buat seorang suami, yang akan segera datang, yang tugasmu menunggunya.”</p>
<p>Senyum gadis itu selalu pada bayangnya di cermin. Alisnya melengkung indah, bulu matanya lentik, hidungnya mancung bangir, bibirnya tipis merah, kulitnya coklat halus, badannya semampai.</p>
<p>Nona-nona Belanda kerap meliriknya. Iri.</p>
<p>“Tapi bagaimana dunia akan melirik? Jika ibu bapak menabiriku dengan kebodohan pingitan?”</p>
<p>Kecut wajahnya.</p>
<p>“Negeri ini sudah begini sejak dulu,” keluhnya.</p>
<p>Maka merah padam wajah Sarina. Menyala sesuatu dalam dadanya: perubahan.</p>
<p>Ia sering bermimpi desanya menjelma sebuah kota di suatu tempat, yang semua orang di sana bebas bersekolah, bekerja, melakukan apa saja yang sesuai dengan isi hati mereka. Terutama bagi perempuan, tak ada kekangan.</p>
<p>Matanya nanar mencari wajah-wajah yang bisa menjanjikannya perubahan.</p>
<p>“Tidak ada!” bisiknya, lirih, sedih. “Orang-orang negeri ini akan selamanya begini….”</p>
<p>Bayangan ceria nona-nona Belanda, keanggunan nyonya-nyonya dan karisma tuan-tuan kulit putih mengalirkan kenyamanan dalam hatinya.</p>
<p>Ketika muncul wajah Meneer Kolonel Egbert, hati perempuan itu kian damai.</p>
<p>Hari itu warga desa dikumpulkan di alun-alun oleh tentara Belanda. Semua laki-laki besar kecil, tua muda diangkut dengan truk. Sarina tak paham ke mana dan untuk apa. Para perempuan dibedakan. Anak-anak kecil dan orang tua disuruh pulang, sedangkan remaja -ada dua belas orang- disuruh menghadap komandan mereka, Kolonel Egbert.</p>
<p>Seorang sersan -sambil senyam senyum, ekor mata melirik nakal kepada para gadis- membisikkan sesuatu di telinga kolonel itu.</p>
<p>Sarina paham ada kejahatan dalam senyum itu.</p>
<p>Muka Kolonel Egbert berubah merah, dan deras tangan kekarnya menampar muka sersan itu.</p>
<p>Entah apa katanya, dalam Bahasa Belanda, Sarina tak mengerti. Yang jelas kemudian semua gadis disuruh pulang oleh sersan yang kecut itu.</p>
<p>Sarina ditahan sebentar oleh sang kolonel.</p>
<p>“Kau cantik, dan akan bagus kalau pintar.”</p>
<p>Kalimat terbata-bata karena logat Belanda itu menggema bagai lagu yang aneh, tapi merdu di ruang batin Sarina.</p>
<p>Dan ia geram saat suara Demang Joko menyusup.</p>
<p>Pria itu pernah menarik tangannya dan berkata, “Kamu ayu, harusnya menjadi isteri keempatku.”</p>
<p>Damainya, jika negeri ini terus diperintah Belanda. Menggema selalu kata hatinya, setelah hari di alun-alun itu.</p>
<p>Dini hari, perempuan desa itu melepaskan diri dari kungkungan jeruji kamarnya. Ibu bapaknya masih lelap, sementara ia gegas melangkah, menyusuri gulita jalan yang telah ia pilih: ikut berjuang agar Belanda tetap berkuasa.</p>
<p style="text-align: center;">***</p>
<p>Gulita sesungguhnya kembali memunculkan Kapten Mulyo. Ia menuju barak komandan lagi.</p>
<p>“Barak, barang-barang pribadi prajurit telah diperiksa. Tak ada yang mencurigakan.” Lapornya setiba di depan Mayor Hasan. “Bagaimana kalau kita mencoba berpikir bahwa mata-mata itu perempuan.”</p>
<p>Mayor Hasan tertawa. Terbahak-bahak. Matanya sampai memicing, menahan geli teramat sangat.</p>
<p>Ia sedang melihat sekelompok pria mata-mata yang diinterogasinya dalam berbagai medan pertempuran. Lembing di mata mereka, hendak menghujam Mayor Hasan yang akan segera melubangi kepala mereka dengan pelor. Lalu senyum sinis, mengejek, sebagai jawaban tegas atas pertanyaan-pertanyaan interogator. Ludah mereka percikkan pula ke lantai, biar pun akan lumer dalam genangan darah.</p>
<p>Pandangannya beralih pula kepada perempuan medis yang terus bercengkerama.</p>
<p>Pikirannya membawanya lagi ke ruang interogasi. Ratap tangis meminta ampun, meminta dibebaskan meledak, membuat tawa mayor itu meledak lagi.</p>
<p>“Memanggul senapan saja mereka kuragukan, Kapten! Apalagi menghadapi risiko seorang mata-mata,” katanya di antara sisa tawanya.</p>
<p>“Siapa perempuan di sini yang akan berani berkorban menghadapi risiko itu?”</p>
<p>Bibir Kapten Mulyo terkatup. Kepalanya menggeleng-geleng.</p>
<p>Tapi… kepalanya tiba-tiba tegak terdiam. Tatapannya menumbuk sapu tangan merah jambu dengan bordiran bunga tulip dan tulisan kecil “Willem-Sari” yang menjuntai digenggam Hasan.</p>
<p>“Bagus sapu tangannya, Komandan,” selidiknya. Dadanya gemuruh.</p>
<p>“Oh, ini... sapu tangan Sarina, tertinggal.” Agak gugup Mayor Hasan, merasa tak seharusnya sapu tangan itu ada di tangannya.</p>
<p>Sesosok tubuh letnan Belanda terkapar dalam ingatan Mulyo. Ingatan dari penyerangan yang ia pimpin dua minggu lalu.</p>
<p>Perwira penjajah itu baru terjengkang setelah granat salah seorang prajurit kompi meledak di depannya.</p>
<p>Tangan kirinya, yang terulur layu masih menggenggam sehelai sapu tangan biru dengan bordiran bunga tulip.</p>
<p>Tertarik, Kapten Mulyo melihatnya lebih dekat. Ada tulisan kecil “Willem-Sari” di bawah bunga tulip. Dibordir pula.</p>
<p>Ia tersenyum. “Pasti namanya dan kekasihnya,” terkanya seraya meninggalkan jasad musuhnya itu.</p>
<p>“Komandan tak perhatikan tulisan di sapu tangan itu?” Pertanyaan tiba-tiba dari Kapten Mulyo menghentak, memancing rasa penasaran Hasan.</p>
<p>Diangkatkan sapu tangan itu, dibentangkan, dan… muka sang komandan berubah. Kecut!</p>
<p>Lelaki yang ada hati pada Sarina itu kecewa karena ia langsung berkeyakinan bahwa dirinya sudah punya saingan!</p>
<p>“Willem?” bisiknya kalut.</p>
<p>Tak ada tabik lagi. Merah padam wajah Kapten Mulyo. Ia pergi begitu saja. Derap sepatu but-nya di tanah basah meninggalkan jejak kemarahan, yang tak dimengerti komandannya.</p>
<p>Alis Mayor Hasan berkerut, menatap kapten itu yang kini sedang berhadapan dengan Sarina yang tiba-tiba muncul dari balik barak.</p>
<p>Ia tidak mendengar percakapan mereka yang memanaskan udara malam yang semakin dingin.</p>
<p>“Saya lupa sesuatu di barak komandan.”</p>
<p>“Sapu tangan dengan bordiran bunga tulip, kan?”</p>
<p>Berubah raut wajah Sarina. Andai terang akan jelas ekspresinya kecut.</p>
<p>“Itu pasangan sapu tangan kekasihmu yang tewas dalam pertempuran dua minggu lalu, kan?”</p>
<p>Tubuh Sarina gemetar.</p>
<p>Tatapan Kapten Mulyo menghujam. Telapak tangan kanannya terangkat pelan, menempel di pistol yang melekati pinggangnya.</p>
<p>“Sarina! Kemari!”</p>
<p>Seruan Mayor Hasan menghentak kedua orang itu. Bara udara padam tiba-tiba.</p>
<p>Tapi tidak bara di dada Mulyo.</p>
<p>Ia berbalik, menatapi punggung perempuan yang telah masuk ke dalam barak pimpinannya itu.</p>
<p>Tiba-tiba sebuah letusan membelah malam, dari pistol yang teracung tinggi di tangan gemetar Kapten Mulyo.</p>
<p>Mata Mayor Hasan terbelalak. Seluruh prajurit terperanjat dan mengerumuni kapten mereka.</p>
<p>Mereka bingung.</p>
<p>Hanya Sarina yang tahu arti letusan itu. [*]</p>`,
    },
    {
      id: "Makhluk Malang dalam Karung",
      judul: "Makhluk Malang dalam Karung",
      penulis: "Arianto Adipurwanto",
      authorEmail: null,
      genre: "Non-Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2026/01/2601-07-Makhluk-Malang-dalam-Karung-jpg.webp",
      sinopsis:
        "Sebuah karung diseret di lantai kayu pada malam yang larut. Tak seorang pun berani bertanya isinya — sampai rahasia desa itu akhirnya terkuak.",
      isi: "<p>Malam semakin larut saat suara seretan karung terdengar di lantai kayu. Tidak ada yang berani bertanya apa isinya.</p><p>Di dalam karung itu, sesuatu bergerak-gerak lemah. Sebuah rahasia desa yang selama ini disembunyikan rapat-rapat kini mulai terkuak.</p>",
    },
    {
      id: "Kawan Masa Lalu",
      judul: "Kawan Masa Lalu",
      penulis: "Budi Hatees",
      authorEmail: null,
      genre: "Biografi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/12/2512-17-Kawan-Masa-Lalu-Budi-Hatees-jpg.webp",
      sinopsis:
        "Pertemuan tak terduga dengan seorang kawan lama di kedai kopi tua membuka kembali kenangan dan janji-janji masa sekolah yang tak pernah ditepati.",
      isi: '<p>Pertemuan itu terjadi di sebuah kedai kopi tua. Wajahnya hampir tak kukenali, tertutup oleh kerutan waktu dan beban hidup.</p><p>"Sudah lama ya," katanya pelan. Suaranya masih sama, membawa kembali memori tentang janji-janji masa sekolah yang tak pernah ditepati.</p>',
    },
    {
      id: "Pohon Kepala",
      judul: "Pohon Kepala",
      penulis: "Surya Gemilang",
      authorEmail: null,
      genre: "Seni",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/12/2512-07-Pohon-Kepala-Cerpen-Surya-Gemilang.webp",
      sinopsis:
        "Di pesisir tumbuh sebuah pohon ganjil yang berbuah menyerupai wajah manusia. Penduduk percaya pohon itu membisikkan nama mereka yang akan hilang di laut.",
      isi: "<p>Di pinggir pantai itu, tumbuh sebuah pohon yang aneh. Penduduk desa menyebutnya Pohon Kepala karena bentuk buahnya yang menyerupai wajah manusia.</p><p>Konon, setiap kali angin kencang bertiup, pohon itu akan membisikkan nama-nama mereka yang akan hilang di laut.</p>",
    },
    {
      id: "Melukis Grindelwald",
      judul: "Melukis Grindelwald",
      penulis: "Yuan Jonta",
      authorEmail: null,
      genre: "Seni",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/10/2510-17-Melukis-Grindelwald-Cerpen-Yuan-Jonta-Bacapetra.webp",
      sinopsis:
        "Seorang pelukis terobsesi menangkap aura kengerian Grindelwald di atas kanvas — sosok yang baginya bukan sekadar dongeng, melainkan nyata dalam ketakutannya sendiri.",
      isi: "<p>Kuas itu menari di atas kanvas. Setiap goresan warna gelap menggambarkan kengerian yang tersembunyi di balik pegunungan Alpen.</p><p>Sang pelukis terobsesi menangkap aura Grindelwald, sosok yang tidak hanya ada dalam dongeng, tapi nyata dalam ketakutannya.</p>",
    },
    {
      id: "Larao",
      judul: "Larao",
      penulis: "Sayyidati Hajar",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/08/2508-17-Larao-Cerpen-Sayyidati-Hajar.webp",
      sinopsis: "Sebuah kisah mendalam yang mengangkat relasi manusia, tradisi, dan pergulatan batin di tengah kehidupan masyarakat lokal.",
      isi: "<p>Larao berjalan menyusuri jalanan setapak yang dipenuhi dedaunan kering. Pikirannya melayang pada percakapan tadi malam bersama tetua kampung.</p><p>Setiap langkah terasa begitu berat, namun ia tahu bahwa keputusan ini harus diambil demi kelangsungan hidup keluarganya.</p>"
    },
    {
      id: "Hantu-Hantu Benteng Lodewijk",
      judul: "Hantu-Hantu Benteng Lodewijk",
      penulis: "Pramudya Utari",
      authorEmail: null,
      genre: "Sejarah",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/08/2508-07-Hantu-Hantu-Benteng-Lodewijk.webp",
      sinopsis: "Mengisahkan tentang misteri dan memori yang membayang di reruntuhan benteng bersejarah Lodewijk yang miring ke arah laut.",
      isi: "<p>Reruntuhan batu bata Benteng Lodewijk yang sudah miring ke arah laut itu menyimpan seribu kisah sunyi. Angin malam berhembus kencang membawa aroma garam dan masa lalu.</p><p>Konon, di bawah rembulan, bayang-bayang sejarah kembali hidup, membisikkan nama-nama yang telah lama dilupakan oleh waktu.</p>"
    },
    {
      id: "Sordidus",
      judul: "Sordidus",
      penulis: "Aveus Har",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/07/2507-17-sordidus-cerpen-aveus-har.webp",
      sinopsis: "Kisah ironis Sordidus, pria yang dipenjara selama 20 tahun atas kejahatan yang tidak pernah ia lakukan, sementara keluarganya menerima kompensasi misterius.",
      isi: "<p>Dua puluh tahun di balik jeruji besi bukanlah waktu yang singkat bagi kejahatan yang tidak pernah dilakukan Sordidus. Di luar sana, keluarganya hidup makmur berkat dana misterius.</p><p>Ia terjebak dalam ironi kehidupan: kebebasannya ditukar dengan kesejahteraan orang-orang yang ia cintai.</p>"
    },
    {
      id: "Qabil dan Gagak",
      judul: "Qabil dan Gagak",
      penulis: "Amina Gaylene",
      authorEmail: null,
      genre: "Religi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/07/2507-07-qabil-dan-gagak-amina-gaylene.webp",
      sinopsis: "Sebuah kisah filosofis dari sudut pandang seekor gagak yang mengamati konflik keluarga Adam akibat ambisi pembangunan tangga menuju surga.",
      isi: "<p>Dari dahan pohon Tarugama, aku melihat Qabil tertunduk lesu. Keringat dan amarah bercampur di wajahnya setelah seharian membangun tangga impian ayahnya.</p><p>Hutan yang dulu hijau kini mulai gundul, dan kedamaian keluarga itu perlahan runtuh bersama ambisi yang tak berujung.</p>"
    },
    {
      id: "Lopo Thea",
      judul: "Lopo Thea",
      penulis: "Marselus Natar",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/06/2506-17-Lopo-Thea-Cerpen-Marselus-Natar.webp",
      sinopsis: "Perjuangan Lopo Thea membantu kelahiran anak Avelia melalui perpaduan ritual tradisional di tanah Flores.",
      isi: "<p>Malam semakin larut di Ende ketika Lopo Thea mengeluarkan gelang akar bahar dan batok kelapa tuanya. Avelia mengerang kesakitan di dalam bilik bambu.</p><p>Dengan bisikan doa leluhur dan keyakinan adat, ia berusaha menuntun kehidupan baru ke dunia ini.</p>"
    },
    {
      id: "Saya Terpaksa untuk Merangkak",
      judul: "Saya Terpaksa untuk Merangkak",
      penulis: "Gagah Pranaja Sirat",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/06/2506-07-Saya-Terpaksa-untuk-Merangkak.webp",
      sinopsis: "Sebuah pencarian menegangkan di tengah rimbunnya belantara dan semak-semak yang menyimpan rahasia kehidupan liar.",
      isi: "<p>A, saya terpaksa untuk merangkak. Menyingkap rimbun perdu dan semak-semak yang tajam menusuk kulit. Di depan sana, alam sedang mempertontonkan pertarungan abadinya.</p><p>Buaya melawan gurita. Siapa yang akan keluar sebagai pemenang dalam rimba yang tak kenal ampun ini?</p>"
    },
    {
      id: "Pohon Durian Bobi",
      judul: "Pohon Durian Bobi",
      penulis: "Aura Asmaradana",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/05/2505-17-Pohon-Durian-Bobi-Aura-Asmaradana.webp",
      sinopsis: "Kisah kepedihan Bobi saat pohon-pohon durian warisan ibunya ditebang habis, memicu kegelisahan di seluruh desa.",
      isi: "<p>Bobi berdiri mematung menatap tunggul-tunggul pohon durian yang telah rata dengan tanah. Empat puluh pohon durian yang ia rawat dengan kasih sayang peninggalan ibunya kini sirna.</p><p>Kehilangan ini bukan sekadar tentang pohon, melainkan kenangan manis yang dipaksa tumbang oleh tangan-tangan jahil di desa mereka.</p>"
    },
    {
      id: "Wolo, Si Siluman Harimau",
      judul: "Wolo, Si Siluman Harimau",
      penulis: "Yohanes L. Avendri",
      authorEmail: null,
      genre: "Fiksi",
      img: "https://www.bacapetra.co/wp-content/uploads/2025/05/2505-07-Wolo-Si-Siluman-Harimau.webp",
      sinopsis: "Ketegangan di sebuah desa ketika mitos siluman harimau Wolo dituding sebagai penyebab kematian orang tua Mei, gadis yang rasional.",
      isi: "<p>Warga desa menggantungkan botol-botol wewangian di kebun mereka, percaya bahwa itu akan menjauhkan mereka dari Wolo, siluman harimau yang melegenda.</p><p>Namun Mei menolak percaya. Baginya, kematian orang tuanya adalah takdir alam, bukan karena cakar makhluk mistis yang ditakuti seluruh kampung.</p>"
    },
  ];

  /* Beberapa review contoh agar rating & rekomendasi tidak kosong di awal */
  var SEED_REVIEWS = [
    {
      bookId: "Keputusan Vero",
      userEmail: "demo1@lokalreads.id",
      userName: "Rina W.",
      rating: 5,
      text: "Endingnya bikin merinding. Karakter Vero terasa sangat nyata.",
    },
    {
      bookId: "Keputusan Vero",
      userEmail: "demo2@lokalreads.id",
      userName: "Bagus P.",
      rating: 4,
      text: "Tema yang dekat dengan keseharian. Tulisannya mengalir.",
    },
    {
      bookId: "Singa Putih",
      userEmail: "demo3@lokalreads.id",
      userName: "Dewi A.",
      rating: 5,
      text: "Atmosfernya kuat sekali, serasa ikut merinding di kampung itu.",
    },
    {
      bookId: "Mata-Mata",
      userEmail: "demo1@lokalreads.id",
      userName: "Rina W.",
      rating: 4,
      text: "Ketegangan dibangun pelan tapi efektif.",
    },
    {
      bookId: "Sulis dalam Tiga Babak",
      userEmail: "demo2@lokalreads.id",
      userName: "Bagus P.",
      rating: 5,
      text: "Sulis ikon banget. Tiga babaknya bikin penasaran terus.",
    },
    {
      bookId: "Pohon Kepala",
      userEmail: "demo3@lokalreads.id",
      userName: "Dewi A.",
      rating: 4,
      text: "Imajinatif dan agak gelap, suka gaya berceritanya.",
    },
  ];

  /* Pembaca contoh agar statistik penulis tidak nol */
  var SEED_READS = {
    "Keputusan Vero": [
      "demo1@lokalreads.id",
      "demo2@lokalreads.id",
      "demo3@lokalreads.id",
    ],
    "Singa Putih": ["demo3@lokalreads.id", "demo1@lokalreads.id"],
    "Mata-Mata": ["demo1@lokalreads.id"],
    "Sulis dalam Tiga Babak": ["demo2@lokalreads.id", "demo3@lokalreads.id"],
    "Pohon Kepala": ["demo3@lokalreads.id"],
  };

  /* ---------------------- util penyimpanan ---------------------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("LokalReads: gagal menyimpan ke localStorage", e);
      return false;
    }
  }
  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /* Inisialisasi seed sekali saja */
  function ensureSeed() {
    var currentBooks = read(KEYS.books, []);
    var singaPutih = currentBooks.find(b => b.id === "Singa Putih");
    var vero = currentBooks.find(b => b.id === "Keputusan Vero");
    var sulis = currentBooks.find(b => b.id === "Sulis dalam Tiga Babak");
    var matamata = currentBooks.find(b => b.id === "Mata-Mata");
    var needsUpdate = !singaPutih || singaPutih.isi.length < 500 ||
                      !vero || vero.isi.length < 500 ||
                      !sulis || sulis.isi.length < 500 ||
                      !matamata || matamata.isi.length < 500;
    if (!localStorage.getItem(KEYS.seeded) || currentBooks.length < SEED_BOOKS.length || needsUpdate) {
      write(KEYS.books, clone(SEED_BOOKS));
      var revs = SEED_REVIEWS.map(function (r, i) {
        return {
          id: "seed_rev_" + i,
          bookId: r.bookId,
          userEmail: r.userEmail,
          userName: r.userName,
          rating: r.rating,
          text: r.text,
          createdAt: Date.now() - (SEED_REVIEWS.length - i) * 86400000,
        };
      });
      write(KEYS.reviews, revs);
      write(KEYS.reads, clone(SEED_READS));
      write(KEYS.seeded, true);
    }
    /* jaga-jaga jika kunci hilang */
    if (!localStorage.getItem(KEYS.books)) write(KEYS.books, clone(SEED_BOOKS));
    if (!localStorage.getItem(KEYS.reviews)) write(KEYS.reviews, []);
    if (!localStorage.getItem(KEYS.reads)) write(KEYS.reads, {});
  }

  /* ------------------------- BUKU ------------------------- */
  function getBooks() {
    ensureSeed();
    return read(KEYS.books, []);
  }

  function getBook(id) {
    if (!id) return null;
    var books = getBooks();
    var found = null;
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === id) {
        found = books[i];
        break;
      }
    }
    if (found) return found;
    /* fallback: cocokkan berdasarkan judul (kompatibilitas tautan lama) */
    for (var j = 0; j < books.length; j++) {
      if (books[j].judul === id) return books[j];
    }
    return null;
  }

  function addBook(data) {
    var books = getBooks();
    var book = {
      id: "book_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      judul: (data.judul || "").trim(),
      penulis: (data.penulis || "").trim(),
      authorEmail: data.authorEmail || null,
      genre: data.genre || "Fiksi",
      img: data.img || "",
      sinopsis: (data.sinopsis || "").trim(),
      isi: data.isi || "",
      createdAt: Date.now(),
    };
    books.push(book);
    write(KEYS.books, books);
    return book;
  }

  function updateBook(id, patch) {
    var books = getBooks();
    for (var i = 0; i < books.length; i++) {
      if (books[i].id === id) {
        ["judul", "genre", "img", "sinopsis", "isi"].forEach(function (f) {
          if (patch[f] !== undefined) books[i][f] = patch[f];
        });
        write(KEYS.books, books);
        return books[i];
      }
    }
    return null;
  }

  function deleteBook(id) {
    var books = getBooks();
    var newBooks = books.filter(function (b) {
      return b.id !== id;
    });
    if (newBooks.length !== books.length) {
      write(KEYS.books, newBooks);
      return true;
    }
    return false;
  }

  function getAuthorBooks(email) {
    if (!email) return [];
    return getBooks().filter(function (b) {
      return b.authorEmail === email;
    });
  }

  /* ------------------------ REVIEW ------------------------ */
  function getAllReviews() {
    ensureSeed();
    return read(KEYS.reviews, []);
  }

  function getReviews(bookId) {
    return getAllReviews()
      .filter(function (r) {
        return r.bookId === bookId;
      })
      .sort(function (a, b) {
        return b.createdAt - a.createdAt;
      });
  }

  function getUserReview(bookId, email) {
    if (!email) return null;
    var list = getAllReviews();
    for (var i = 0; i < list.length; i++) {
      if (list[i].bookId === bookId && list[i].userEmail === email)
        return list[i];
    }
    return null;
  }

  /* Satu user = satu review per buku (kalau sudah ada, diperbarui) */
  function addReview(data) {
    var reviews = getAllReviews();
    var existingIdx = -1;
    for (var i = 0; i < reviews.length; i++) {
      if (
        reviews[i].bookId === data.bookId &&
        reviews[i].userEmail === data.userEmail
      ) {
        existingIdx = i;
        break;
      }
    }
    var entry = {
      id: existingIdx >= 0 ? reviews[existingIdx].id : "rev_" + Date.now(),
      bookId: data.bookId,
      userEmail: data.userEmail || "anonim",
      userName: data.userName || "Anonim",
      rating: Math.max(1, Math.min(5, parseInt(data.rating, 10) || 0)),
      text: (data.text || "").trim(),
      createdAt: Date.now(),
    };
    if (existingIdx >= 0) reviews[existingIdx] = entry;
    else reviews.push(entry);
    write(KEYS.reviews, reviews);
    return entry;
  }

  function getRating(bookId) {
    var list = getReviews(bookId);
    if (!list.length) return { avg: 0, count: 0 };
    var sum = list.reduce(function (s, r) {
      return s + r.rating;
    }, 0);
    return { avg: sum / list.length, count: list.length };
  }

  /* --------------------- STATISTIK BACA --------------------- */
  function getReadsMap() {
    ensureSeed();
    return read(KEYS.reads, {});
  }

  function recordRead(bookId, email) {
    if (!bookId) return;
    var map = getReadsMap();
    if (!map[bookId]) map[bookId] = [];
    var who = email || "guest";
    if (map[bookId].indexOf(who) === -1) {
      map[bookId].push(who);
      write(KEYS.reads, map);
    }
  }

  function getReaderCount(bookId) {
    var map = getReadsMap();
    return map[bookId] ? map[bookId].length : 0;
  }

  /* ----------------- STATISTIK UNTUK PENULIS ----------------- */
  function getAuthorStats(email) {
    var books = getAuthorBooks(email);
    var totalReaders = 0,
      totalReviews = 0,
      ratingSum = 0,
      ratingCount = 0;
    var recentReviews = [];
    books.forEach(function (b) {
      totalReaders += getReaderCount(b.id);
      var revs = getReviews(b.id);
      totalReviews += revs.length;
      revs.forEach(function (r) {
        ratingSum += r.rating;
        ratingCount++;
        recentReviews.push({ review: r, book: b });
      });
    });
    recentReviews.sort(function (a, b) {
      return b.review.createdAt - a.review.createdAt;
    });
    return {
      totalBooks: books.length,
      totalReaders: totalReaders,
      totalReviews: totalReviews,
      avgRating: ratingCount ? ratingSum / ratingCount : 0,
      recentReviews: recentReviews.slice(0, 5),
      books: books,
    };
  }

  /* Statistik per buku (dipakai daftar "Buku Saya") */
  function getBookStats(bookId) {
    var rating = getRating(bookId);
    return {
      readers: getReaderCount(bookId),
      avgRating: rating.avg,
      reviewCount: rating.count,
    };
  }

  /* ------------------- MESIN REKOMENDASI -------------------
     Skor transparan berbasis minat pengguna:
       0.50  cocok genre dengan minat user
       0.25  kualitas (rata-rata rating / 5)
       0.15  popularitas (jumlah pembaca, dibatasi)
       0.10  kebaruan (buku baru sedikit terangkat)
       +boost kecil bila belum dibaca user
     --------------------------------------------------------- */
  function scoreBook(book, user, readSet) {
    var genres = user && user.genres ? user.genres : [];
    var genreMatch = genres.indexOf(book.genre) !== -1 ? 1 : 0;
    var rating = getRating(book.id);
    var quality = rating.avg / 5; // 0..1
    var readers = getReaderCount(book.id);
    var popularity = Math.min(readers, 30) / 30; // 0..1
    var ageDays = book.createdAt
      ? (Date.now() - book.createdAt) / 86400000
      : 365;
    var freshness = Math.max(0, 1 - ageDays / 120); // turun selama ~4 bulan
    var unread = readSet && readSet.has && readSet.has(book.id) ? 0 : 1;

    var score =
      0.5 * genreMatch +
      0.25 * quality +
      0.15 * popularity +
      0.1 * freshness +
      0.05 * unread;

    var reason;
    if (genreMatch) reason = "Sesuai minatmu: " + book.genre;
    else if (rating.count && rating.avg >= 4)
      reason = "Rating tinggi (" + rating.avg.toFixed(1) + "★)";
    else if (readers >= 2) reason = "Banyak dibaca";
    else reason = "Mungkin kamu suka";

    return { book: book, score: score, reason: reason, rating: rating };
  }

  function getRecommendations(user, n) {
    n = n || 4;
    var books = getBooks();
    var readSet = new Set();
    if (user && user.email) {
      var map = getReadsMap();
      Object.keys(map).forEach(function (bid) {
        if (map[bid].indexOf(user.email) !== -1) readSet.add(bid);
      });
    }
    var scored = books.map(function (b) {
      return scoreBook(b, user, readSet);
    });
    scored.sort(function (a, b) {
      return b.score - a.score;
    });
    return scored.slice(0, n);
  }

  /* Buku trending: urut berdasarkan jumlah pembaca lalu rating */
  function getTrending(n) {
    n = n || 5;
    var books = getBooks().slice();
    books.sort(function (a, b) {
      var ra = getReaderCount(a.id),
        rb = getReaderCount(b.id);
      if (rb !== ra) return rb - ra;
      return getRating(b.id).avg - getRating(a.id).avg;
    });
    return books.slice(0, n);
  }

  /* ----------------------- SESI / AUTH ----------------------- */
  function getCurrentUser() {
    return read(KEYS.current, null);
  }
  function setCurrentUser(u) {
    write(KEYS.current, u);
  }
  function logout() {
    localStorage.removeItem(KEYS.current);
  }

  function dashboardFor(user) {
    return user && user.role === "author"
      ? "dashboard_author.html"
      : "dashboard_user.html";
  }

  /* Pastikan login; kalau belum, lempar ke login. Return user/null. */
  function requireUser() {
    var u = getCurrentUser();
    if (!u) {
      window.location.href = "login.html";
      return null;
    }
    return u;
  }

  /* Pastikan login DAN role penulis. */
  function requireAuthor() {
    var u = getCurrentUser();
    if (!u) {
      window.location.href = "login.html";
      return null;
    }
    if (u.role !== "author") {
      window.location.href = "dashboard_user.html";
      return null;
    }
    return u;
  }

  /* --------------------- util tampilan --------------------- */
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Bintang sebagai teks (untuk ringkasan kecil) */
  function starString(avg) {
    var full = Math.round(avg);
    var s = "";
    for (var i = 1; i <= 5; i++) s += i <= full ? "★" : "☆";
    return s;
  }

  function timeAgo(ts) {
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "baru saja";
    if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
    if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
    if (diff < 2592000) return Math.floor(diff / 86400) + " hari lalu";
    return new Date(ts).toLocaleDateString("id-ID");
  }

  /* ====================================================================
     LAPISAN PENGALAMAN MEMBACA (favorit, wishlist, progres, kepemilikan,
     tantangan, distribusi rating). Semua per-pengguna, disimpan di
     localStorage. Jika belum login, dipakai uid 'guest'.
     ==================================================================== */
  function uid(email) {
    return email || (getCurrentUser() && getCurrentUser().email) || "guest";
  }

  /* Estimasi jumlah halaman dari panjang isi (deterministik per buku) */
  function pagesFor(book) {
    if (!book) return 120;
    if (book.totalPages) return book.totalPages;
    var plain = (book.isi || book.sinopsis || "").replace(/<[^>]+>/g, "");
    var est = Math.round(plain.length / 28); // ~28 char per "halaman" mini
    return Math.max(60, Math.min(420, est || 120));
  }



  /* --------- daftar berbasis koleksi (favorit & wishlist) --------- */
  function getList(key, email) {
    var all = read(key, {});
    return all[uid(email)] || [];
  }
  function toggleList(key, bookId, email) {
    var all = read(key, {});
    var u = uid(email);
    var list = all[u] || [];
    var i = list.indexOf(bookId);
    if (i === -1) list.push(bookId);
    else list.splice(i, 1);
    all[u] = list;
    write(key, all);
    return list.indexOf(bookId) !== -1; // true jika sekarang aktif
  }
  function inList(key, bookId, email) {
    return getList(key, email).indexOf(bookId) !== -1;
  }

  function getFavorites(email) {
    return getList(KEYS.favorites, email);
  }
  function isFavorite(bookId, email) {
    return inList(KEYS.favorites, bookId, email);
  }
  function toggleFavorite(bookId, email) {
    return toggleList(KEYS.favorites, bookId, email);
  }

  function getWishlist(email) {
    return getList(KEYS.wishlist, email);
  }
  function isWishlisted(bookId, email) {
    return inList(KEYS.wishlist, bookId, email);
  }
  function toggleWishlist(bookId, email) {
    return toggleList(KEYS.wishlist, bookId, email);
  }

  /* ----------------------- PROGRES MEMBACA ----------------------- */
  function getAllProgress(email) {
    var all = read(KEYS.progress, {});
    return all[uid(email)] || {};
  }
  function getProgress(bookId, email) {
    return getAllProgress(email)[bookId] || null;
  }
  function setProgress(bookId, email, patch) {
    var all = read(KEYS.progress, {});
    var u = uid(email);
    if (!all[u]) all[u] = {};
    var book = getBook(bookId);
    var total =
      (patch && patch.totalPages) ||
      (all[u][bookId] && all[u][bookId].totalPages) ||
      pagesFor(book);
    var last =
      patch && patch.lastPage != null
        ? patch.lastPage
        : all[u][bookId]
          ? all[u][bookId].lastPage
          : 0;
    last = Math.max(0, Math.min(total, last));
    var percent = total ? Math.round((last / total) * 100) : 0;
    var status = percent >= 100 ? "finished" : "reading";
    var updatedAt = patch && patch.updatedAt ? patch.updatedAt : Date.now();
    all[u][bookId] = {
      lastPage: last,
      totalPages: total,
      percent: percent,
      status: status,
      updatedAt: updatedAt,
    };
    write(KEYS.progress, all);
    pushHistory(bookId, status === "finished" ? "finished" : "reading", email);
    return all[u][bookId];
  }
  function removeProgress(bookId, email) {
    var all = read(KEYS.progress, {});
    var u = uid(email);
    if (all[u] && all[u][bookId]) {
      delete all[u][bookId];
      write(KEYS.progress, all);
    }
  }
  function markFinished(bookId, email) {
    var book = getBook(bookId);
    return setProgress(bookId, email, {
      lastPage: pagesFor(book),
      totalPages: pagesFor(book),
    });
  }
  /* 'none' | 'reading' | 'finished' */
  function getReadingStatus(bookId, email) {
    var p = getProgress(bookId, email);
    return p ? p.status : "none";
  }
  /* Daftar buku yang sedang dibaca (untuk section "Lanjutkan Membaca") */
  function getContinueReading(email) {
    var map = getAllProgress(email);
    return Object.keys(map)
      .filter(function (bid) {
        return map[bid].status === "reading";
      })
      .map(function (bid) {
        return { book: getBook(bid), progress: map[bid] };
      })
      .filter(function (x) {
        return x.book;
      })
      .sort(function (a, b) {
        return b.progress.updatedAt - a.progress.updatedAt;
      });
  }



  /* ----------------------- RIWAYAT MEMBACA ----------------------- */
  function pushHistory(bookId, action, email) {
    var all = read(KEYS.history, {});
    var u = uid(email);
    if (!all[u]) all[u] = [];
    all[u].unshift({ bookId: bookId, action: action, at: Date.now() });
    all[u] = all[u].slice(0, 50);
    write(KEYS.history, all);
  }
  function getHistory(email) {
    var all = read(KEYS.history, {});
    return all[uid(email)] || [];
  }

  /* -------------------- TANTANGAN MEMBACA -------------------- */
  function getReadingChallenge(email) {
    var all = read(KEYS.challenge, {});
    var u = uid(email);
    var year = new Date().getFullYear();
    var c = all[u] || { year: year, target: 12 };
    if (c.year !== year) c = { year: year, target: c.target || 12 };
    var finished = Object.keys(getAllProgress(email)).filter(function (bid) {
      return getAllProgress(email)[bid].status === "finished";
    }).length;
    return {
      year: c.year,
      target: c.target,
      completed: finished,
      percent: c.target
        ? Math.min(100, Math.round((finished / c.target) * 100))
        : 0,
    };
  }
  function setReadingChallenge(target, email) {
    var all = read(KEYS.challenge, {});
    all[uid(email)] = {
      year: new Date().getFullYear(),
      target: Math.max(1, parseInt(target, 10) || 12),
    };
    write(KEYS.challenge, all);
    return getReadingChallenge(email);
  }

  /* ------------------- DISTRIBUSI RATING ------------------- */
  /* { 1..5: jumlah, total, avg } untuk grafik batang horizontal */
  function getRatingDistribution(bookId) {
    var list = getReviews(bookId);
    var dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    var sum = 0;
    list.forEach(function (r) {
      var s = Math.max(1, Math.min(5, r.rating));
      dist[s]++;
      sum += s;
    });
    return {
      dist: dist,
      total: list.length,
      avg: list.length ? sum / list.length : 0,
    };
  }

  /* -------------------- PENULIS & SERUPA -------------------- */
  function getBooksByAuthorName(name, excludeId) {
    return getBooks().filter(function (b) {
      return b.penulis === name && b.id !== excludeId;
    });
  }
  /* Buku serupa: genre sama dulu, lalu rating, sisanya diisi rekomendasi */
  function getSimilarBooks(book, n) {
    n = n || 4;
    if (!book) return [];
    var pool = getBooks().filter(function (b) {
      return b.id !== book.id;
    });
    pool.sort(function (a, b) {
      var ga = a.genre === book.genre ? 1 : 0;
      var gb = b.genre === book.genre ? 1 : 0;
      if (ga !== gb) return gb - ga;
      return getRating(b.id).avg - getRating(a.id).avg;
    });
    return pool.slice(0, n);
  }

  /* =====================================================================
     DUMMY DATA - Untuk demo & testing dashboard
     Data ini akan otomatis ditambahkan untuk user yang login
     ===================================================================== */

  function addDummyDataForUser(email) {
    if (!email) return;

    var books = getBooks();
    if (books.length < 4) return; // Butuh minimal 4 buku

    // Ambil 4 buku pertama untuk data dummy
    var book1 = books[0]; // Keputusan Vero
    var book2 = books[1]; // Singa Putih
    var book3 = books[2]; // Sulis dalam Tiga Babak
    var book4 = books[3]; // Mata-Mata

    // 1. PROGRESS MEMBACA - Beberapa buku sedang dibaca
    setProgress(book1.id, email, {
      lastPage: 45,
      totalPages: 120,
      updatedAt: Date.now() - 3600000, // 1 jam lalu
    });

    setProgress(book2.id, email, {
      lastPage: 78,
      totalPages: 150,
      updatedAt: Date.now() - 7200000, // 2 jam lalu
    });

    setProgress(book3.id, email, {
      lastPage: 30,
      totalPages: 200,
      updatedAt: Date.now() - 86400000, // 1 hari lalu
    });

    // 2. BUKU SELESAI - 2 buku sudah selesai
    markFinished(book4.id, email);

    var book5 = books[4] || books[0];
    markFinished(book5.id, email);



    // 4. FAVORIT - Beberapa buku difavoritkan
    toggleFavorite(book1.id, email);
    toggleFavorite(book2.id, email);
    toggleFavorite(book4.id, email);

    // 5. WISHLIST - Beberapa buku di wishlist
    if (books[5]) {
      toggleWishlist(books[5].id, email);
    }
    if (books[6]) {
      toggleWishlist(books[6].id, email);
    }

    // 6. REVIEW - User sudah menulis beberapa review
    var currentUser = getCurrentUser();
    var userName =
      (currentUser && (currentUser.name || currentUser.fullname)) ||
      "Demo User";

    addReview({
      bookId: book1.id,
      userEmail: email,
      userName: userName,
      rating: 5,
      text: "Cerita yang sangat menyentuh! Karakter Vero sangat kuat dan inspiratif.",
    });

    addReview({
      bookId: book2.id,
      userEmail: email,
      userName: userName,
      rating: 4,
      text: "Atmosfer mistisnya terasa banget. Penulis berhasil membawa saya ke kampung Jawa.",
    });

    addReview({
      bookId: book4.id,
      userEmail: email,
      userName: userName,
      rating: 5,
      text: "Tegang dari awal sampai akhir. Plot twist-nya nggak terduga!",
    });

    // 7. HISTORY - Riwayat membaca
    pushHistory(book1.id, "reading", email);
    pushHistory(book2.id, "reading", email);
    pushHistory(book4.id, "finished", email);

    // 8. READING CHALLENGE - Set target 12 buku, sudah selesai 2
    setReadingChallenge(12, email);
  }

  // Auto-add dummy data saat user login (untuk demo)
  // FIX: Override setCurrentUser SEBELUM export
  var originalSetCurrentUser = setCurrentUser;
  setCurrentUser = function (user) {
    originalSetCurrentUser(user);
    if (user && user.email) {
      // Langsung cek dan tambah dummy data tanpa delay
      var progress = getAllProgress(user.email);
      var favorites = getFavorites(user.email);
      var needsDummy =
        Object.keys(progress).length === 0 && favorites.length === 0;
      if (needsDummy) {
        addDummyDataForUser(user.email);
      }
    }
  };

  /* ------------------------- ekspor ------------------------- */
  global.LR = {
    KEYS: KEYS,
    GENRES: GENRES,
    GENRE_ICONS: GENRE_ICONS,
    // buku
    getBooks: getBooks,
    getBook: getBook,
    addBook: addBook,
    updateBook: updateBook,
    deleteBook: deleteBook,
    getAuthorBooks: getAuthorBooks,
    // review
    getAllReviews: getAllReviews,
    getReviews: getReviews,
    getUserReview: getUserReview,
    addReview: addReview,
    getRating: getRating,
    // baca / statistik
    recordRead: recordRead,
    getReaderCount: getReaderCount,
    getAuthorStats: getAuthorStats,
    getBookStats: getBookStats,
    // rekomendasi
    getRecommendations: getRecommendations,
    getTrending: getTrending,
    // auth
    getCurrentUser: getCurrentUser,
    setCurrentUser: setCurrentUser,
    logout: logout,
    dashboardFor: dashboardFor,
    requireUser: requireUser,
    requireAuthor: requireAuthor,
    // util
    escapeHtml: escapeHtml,
    starString: starString,
    timeAgo: timeAgo,
    ensureSeed: ensureSeed,
    // pengalaman membaca (baru)
    pagesFor: pagesFor,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    getWishlist: getWishlist,
    isWishlisted: isWishlisted,
    toggleWishlist: toggleWishlist,
    getAllProgress: getAllProgress,
    getProgress: getProgress,
    setProgress: setProgress,
    removeProgress: removeProgress,
    markFinished: markFinished,
    getReadingStatus: getReadingStatus,
    getContinueReading: getContinueReading,
    getHistory: getHistory,
    getReadingChallenge: getReadingChallenge,
    setReadingChallenge: setReadingChallenge,
    getRatingDistribution: getRatingDistribution,
    getBooksByAuthorName: getBooksByAuthorName,
    getSimilarBooks: getSimilarBooks,
    getAuthorProfile: getAuthorProfile,
    AUTHOR_PROFILES: AUTHOR_PROFILES,
    // dummy data (untuk demo)
    addDummyDataForUser: addDummyDataForUser,
  };

  ensureSeed();
})(window);
