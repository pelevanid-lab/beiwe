# Книга Beiwe
### Многоуровневая конституция умной рабочей области

*Версия 2.0*

> "Beiwe için inşa edilen her şey bu kitaba uymak zorundadır."

Bu doküman bir pazarlama materyali değildir. Bir tasarım rehberi de değildir. Bu, Beiwe'nin var oluş nedenini, davranış kurallarını, karar mekanizmasını ve ticari duruşunu tanımlayan bir anayasadır. Sprint'ler gelir geçer, özellikler değişir, ekranlar yeniden tasarlanır — ama bu kitapta yazılanlar sabit kalır. Bir ekip üyesi bir karar verirken tereddüt ettiğinde, buraya bakar. Cevap burada değilse, cevap henüz yoktur; icat edilmemeli, bu kitaba danışılarak birlikte yazılmalıdır.

---

## Глава 1 — Почему существует Beiwe?
*Why Beiwe Exists*

**Amaç: Vizyon**

> **Not:** Beiwe bir web tarayıcısı (browser) değildir. Tarayıcıların akışkan ve tanıdık arayüz dilini (sekme, komut çubuğu) kullanan, ancak amacı web'de gezinmek değil şirket verilerini yönetmek olan Çok Katmanlı bir Akıllı Çalışma Alanıdır (Workspace/OS).

### Günümüz iş dünyasının problemi: Yazılım Yorgunluğu (SaaS Fatigue)
Son on yılda yazılımlar şirketleri daha verimli yapmak için tasarlandı. Ancak bugün geldiğimiz noktada şirketler verimli değil, bölünmüş durumda. Müşteri verisi CRM'de, toplantılar takvimde, görevler proje yönetim aracında, faturalar finans uygulamasında parçalanmış halde duruyor. Bir kullanıcı bir işi çözmek için üç farklı uygulamayı açıp aralarında zihinsel bir efor harcamak zorunda kalıyor. Günümüz yazılımları bilgiyi dijitalleştirdi, ama bağlamı (context) öldürdü.

### Statik Menü paradigmasının sınırları
Geleneksel yazılımlar tek bir varsayım üzerine kuruludur: Kullanıcı ne yapacağını ve menüde nereye tıklayacağını bilir. Ancak gerçek hayattaki işler menülere sığmaz. "Ahmet Bey'in dünkü randevusu neden iptal oldu?", "Şu an öncelikli görevim ne?" gibi sorular, statik sayfalara tıklayarak değil, veriler arasında bağ kurarak cevaplanabilir. Menüler pasiftir; kullanıcının tıklamasını bekler. Oysa modern bir çalışma alanı kullanıcının niyetine proaktif olarak uyum sağlamalıdır.

### AI neden tek başına çözüm değil
Yapay zekâ asistanları bu sorunu kısmen çözdü: Artık menülerde gezinmek yerine sisteme soru sorabiliyoruz. Ama bu da yeni bir yanıltmaca yarattı. Sohbet ekranı, iş yapmak için tasarlanmış bir arayüz (UI) değildir; sadece metin üretir. Kullanıcı sadece metin görmek değil, aynı zamanda işlem yapmak (randevu oluşturmak, faturayı ödemek) ister. Beiwe'nin reddettiği tam olarak budur: Yapay zekâ, sadece konuşulan soyut bir varlık değil, arayüzü kontrol eden bir yönlendirici (router) olmalıdır.

### Context neden kayboluyor
Bugünün uygulamaları silolar halinde çalışır. Her sekme kendi başına bir adadır; birbirinden habersiz, birbirine bağlanmayan, oturum kapandığında yok olan geçici arayüz parçacıklarıdır. Kullanıcı dün girdiği müşteri notunu bugün takvime bağlayamaz, çünkü yazılımların ortak bir hafızası yoktur — sadece veritabanları vardır. Veritabanı ham bir kayıt defteridir, anlamlandırılmış bir bağlam değil.

### Workspace neden yeniden tasarlanmalı
Yazılım, otuz yıldır aynı temel metaforla çalışır: Üst menü, sol menü, formlar ve butonlar. Bu metafor, kullanıcının sisteme uyması üzerine kuruludur. Ama modern ihtiyaç artık kullanıcının yazılıma uyum sağlaması değil, yazılımın kullanıcının niyetine (intent) uyum sağlamasıdır. Arayüzün temel birimi artık "menü" değil, "niyet" olmalıdır. Bu, kozmetik bir güncelleme değil; çalışma alanının (workspace) kendisinin ne olduğuna dair kök bir yeniden tanımdır.

### Clarity Engine (Netlik Motoru) Neden Kalbimizdir?
Beiwe devasa, çok katmanlı bir araçtır (CRM, İK, Finans). Bu kadar derin bir yapıda kaybolmamak için statik menüler yetersizdir. Beiwe'nin tek bir hedefi vardır: **Netlik**. Kullanıcının girdiği cümleyi anlayan, bağlamı süzen ve o an tam olarak hangi modüle (hangi sekmeye) ihtiyaç varsa onu anında kullanıcının önüne seren **Clarity Engine**, Beiwe'nin kalbidir. Bir özellik, kullanıcının zihnindeki karmaşayı azaltıp netliği artırmıyorsa, o özellik Beiwe'de yer almamalıdır.

---

## Глава 2 — Манифест
*Manifesto*

**Amaç: Felsefe**

Bu bölüm teknik değildir. İlham vericidir. Burada yazılanlar bir özellik listesi değil, bir inanç beyanıdır.

> **We don't organize pages. We organize action and understanding.**
> *Biz menüleri ve sayfaları düzenlemiyoruz. Eylemi ve anlayışı düzenliyoruz.*

> **Intent is more important than buttons.**
> *Kullanıcının niyeti, menüdeki butonlardan daha önemlidir.*

> **Memory is the future of work.**
> *Hafıza, çalışmanın geleceğidir.*

> **The workspace should think with you, not wait for you.**
> *Çalışma alanı (Workspace) tıklamanı beklememeli, seninle birlikte düşünmelidir.*

> **A module is a place. Intent is a journey.**
> *Bir modül (CRM/Takvim) statik bir yerdir. Kullanıcının niyeti ise bir yolculuktur.*

> **Software waits for your click. Beiwe asks what you want.**
> *Sıradan yazılımlar senin tıklamanı bekler. Beiwe sana ne yapmak istediğini sorar.*

> **Clarity is not found. It is built.**
> *Netlik bulunmaz. İnşa edilir.*

> **We are not building a faster software. We are building a clearer mind.**
> *Biz daha hızlı bir yazılım inşa etmiyoruz. Daha net bir zihin inşa ediyoruz.*

---

## Глава 3 — Модель ясности
*The Clarity Model*

**Amaç: Ürün Mantığı**

Eski yazılımlar sıralı (sequential) çalışır: Menüye girersin, formu açarsın, veriyi girersin. Beiwe ise **Paralel ve Kademeli (Progressive)** çalışır. Kullanıcıyı menülerle yormaz; arama çubuğundan aldığı tek bir cümleyle arka planda doğru modülleri hazırlar.

```text
Intent (Kullanıcı Niyeti)
   │
   ├──> Akış A: Hemen Eylem (System Awareness)
   │      └──> İlgili Modülün (Müşteri/Takvim) Otomatik Açılması
   │
   └──> Akış B: Kademeli Netlik (Progressive Clarification)
          ├──> Sentez (Geçmiş Verilerin Taranması)
          ├──> Netleştirme Soruları (Eksik Bilginin İstenmesi)
          └──> Eylem Teklifi (Action Proposal)
   │
   v (İki akışın birleşimi)
Decision / Action (Karar ve Eylem)
   ↓
Memory (Saule Hafızası)
```

### 1. Intent (Niyet)
Her şey bir cümle veya soruyla başlar — menüden bir butona tıklayarak değil. Kullanıcı "Ahmet'in randevusunu iptal et" yazdığı an, sistem iki paralel akışı aynı anda başlatır.

### 2. System Awareness (Sıfır Sürtünme)
Eski modeldeki "önce sayfayı bul, sonra veriyi bul" mantığı terk edilmiştir. Cümle gelir gelmez, sistem arka planda hangi modüllerin (Takvim, CRM) ve hangi verilerin (Ahmet) kullanıldığını tespit eder. İlgili arayüz (sekme) **anında** kullanıcının görüş alanına açılır. Kullanıcı asla menü aramaz.

### 3. Progressive Clarification (Kademeli Netleştirme)
İlgili sekme açılırken, arka planda (Clarity Engine) eksik bağlamı doldurmak için netleştirme soruları veya eylem teklifleri belirir: "Ahmet Bey'in Salı günkü randevusunu iptal edip notlara ekleyeyim mi?". Bu adım, klasik yazılımların yapamadığı *bağlamı anlama* eylemidir.

### 4. Decision & Action (Eylem)
Kullanıcı sunulan teklifi onaylar. İşlem, arkada anında gerçekleşir ve açık olan modül canlı olarak güncellenir. Kullanıcı sonucun oluştuğunu fiziksel arayüzde görür.

### 5. Memory (Hafıza)
Yapılan eylem, nedenleriyle birlikte Saule'nin hafıza katmanına yazılır. Bir sonraki soru veya işlem için yeni ve daha güçlü bir bağlam olarak saklanır.

---

## Глава 4 — Принципы рабочей области
*Workspace Principles*

**Amaç: Çalışma Alanı Davranışı**

**İlke 1 — Her şey komut satırından / arama çubuğundan başlar.**
**İlke 2 — Sekmelerden daha önemli olan bağlamdır.**
**İlke 3 — Arayüz kullanıcının arkasından koşmaz, niyetine önceden hazırlar.**
**İlke 4 — Sistem düşünmeyi asla kesintiye uğratmaz.** Agresif popup'lar, gereksiz yükleme ekranları yoktur.
**İlke 5 — Her etkileşim netliği artırmalıdır.**

---

## Глава 5 — Принципы продукта
*Product Principles*

**Amaç: Karar Mekanizması**

**Features are not the product. Clarity is.** (Özellikler ürün değildir. Netlik üründür.)
**AI is the engine, the workspace is the body.** (Yapay zekâ motordur, çalışma alanı (workspace) bedendir.)
**Context outranks structure.** (Bağlam, katı hiyerarşik yapıdan daha üstündür.)
**Memory belongs to the user.** (Hafıza kullanıcıya aittir. Veri yereldir ve şifrelidir.)
**Transparency over optimization.** (Şeffaflık, optimizasyondan önce gelir.)

---

## Глава 6 — Язык дизайна
*Design Language*

**Amaç: Görsel Sistem**

- **Typography:** Başlıklar Playfair Display (Editoryal, düşünen), gövde metni Outfit (Okunabilir, net).
- **Renkler:** Zemin kırık beyaz (#FAFAF8), Metin mürekkep tonu. Vurgu eylemleri için Turuncu-amber. Konsensüs/Uzlaşı sinyalleri için Yeşil.
- **Düzen:** Çok katmanlı ama ferah. Merkezi hizalı komut çubuğu. Alt kısımda esnek sekme yönetimi (Workspace).
- **Bileşenler:** Clarity Engine'in komut çubuğu her zaman kutsaldır. Gölgeler minimaldir, derinlik hiyerarşiden gelir.

---

## Глава 7 — Язык взаимодействия
*Interaction Language*

**Amaç: Kullanıcı Akışı ve Sürtünme Yönetimi**

**Netlik ve Eylem Akışı:**
1. Kullanıcı arama çubuğuna niyetini yazar: "Yeni müşteri ekle."
2. **Sıfır Sürtünme:** Arayüz, ne yapmak istediğini anlar ve hemen "Müşteri Detay" taslak sekmesini altta açar.
3. **Sessiz Sorgulama:** Aynı anda, ekranda netleştirme teklifleri belirir ("Adı nedir?, Telefonu var mı?"). Kullanıcı "form doldurmaya zorlanıyormuş" gibi değil, "asistanla konuşuyormuş" gibi hisseder.
4. Kullanıcı soruları cevapladıkça, aşağıdaki sekme canlı olarak dolar. Kullanıcı eylemin fiziksel olarak gerçekleştiğini hisseder.
5. Kullanıcı bir karara varır, eylemi onaylar ve veri Saule'ye `ingest` edilir.

---

## Глава 8 — Язык движений
*Motion Language*

**Amaç: Animasyon Sistemi**

Hareket, dikkat çekmek için değil, geçişleri anlamlandırmak için vardır. Arama durumundan Sekme açılış durumuna geçiş, ani bir sayfa değişimi değil, yumuşak bir genişleme ve panel belirmesi animasyonudur. Kullanıcı "başka bir sayfaya gitti" hissetmez, "önündeki dosyanın açıldığını" hisseder. Süreler 200-400ms aralığında tutulur, düşünmeyi kesintiye uğratmaz.

---

## Глава 9 — Интеграция Saule
*Saule Integration*

**Amaç: SML + Beiwe İlişkisi**

**Beiwe bedendir, Saule zihindir.** Beiwe (Çalışma Alanı / Arayüz) ile Saule (Hafıza / Veritabanı) arasında Decoupled (Gevşek Bağlı) ve net bir API ayrımı vardır.
İkisi arasındaki iletişim **SMI (Semantic Memory Interface)** adını verdiğimiz köprü üzerinden sağlanır.

### Teknik Bağ ve Veri Akışı
1. **Fiziksel Ayrım:** Beiwe bir frontend (Next.js) uygulamasıdır ve içinde veritabanı taşımaz. Saule Core ise bağımsız bir hafıza sunucusu olarak çalışır (Bulutta, Cloud Function olarak veya On-Premise / Yerel sunucuda barındırılabilir). İkisi HTTP REST API'leri ile konuşur.
2. **Veri Okuma (Recall & Nodes):** Kullanıcı bir niyet belirttiğinde, Beiwe `recall` API'si ile geçmiş bağlamı, `nodes` API'si ile de ham verileri (müşteriler, randevular) mikrosaniyeler içinde Saule'den çeker.
3. **Zeka (Clarity Engine):** Beiwe, bu verileri seçilen Büyük Dil Modeli (LLM) sağlayıcısına sunar ve kullanıcının niyetini çözümleyip bir eylem teklifi (Action Proposal) yaratır. Clarity Engine, tek bir sağlayıcıya (Gemini, Claude, OpenAI vb.) bağımlı kalmayacak şekilde soyutlanmıştır.
4. **Veri Yazma (Ingest):** Kullanıcı eylemi onayladığında, Beiwe `ingest` API'sini çağırarak bu kararı kalıcı bir "memory" (hafıza) düğümü olarak Saule'nin Semantic Memory Layer (SML) ağına yazar.

### Soğuk Başlangıç (Cold Start) ve Tanışma
Sistem ilk kurulduğunda SML veritabanı boştur. Bu "soğuk başlangıç" anında Beiwe'nin kullanıcıyı (ve şirketini) anlayabilmesi için, ilk kurulumda kısa bir "tanışma sohbeti" (Onboarding) yapılır. Şirketin sektörü, iş yapış biçimi ve öncelikleri bu sohbetle alınır ve doğrudan Saule'ye kaydedilir. Böylece ilk gerçek eylemde sistem sıfırdan başlamaz.

*Saule hakkında daha detaylı bilgi için: [getsaule.com](https://getsaule.com)*

---

## Bölüm 10 — Teknik Mimari
*Technical Architecture*

**Amaç: Kod ve Sistem**

```
Workspace (Çok Katmanlı OS)
   ↓
Frontend (Beiwe / Next.js)
   ↓
API (SMI — Semantic Memory Interface & Clarity Engine)
   ↓
Saule Core (SML / SPG / Embeddings / Cloud Functions)
```
- Arayüz tamamen modüler sekmelere dayanır.
- Kullanıcı verisinin mülkiyeti şirkete/kullanıcıya aittir. Sistem, tam izole edilmiş Self-hosted (kendi sunucusunda) veya On-Premise kurulumları destekleyecek şekilde tasarlanmıştır.
- Komut çubuğundaki girdi, API'de (bağımsız LLM sağlayıcılarıyla çalışan Clarity Engine) işlenir, eylem (Action Proposal) olarak geri döner.

---

## Bölüm 11 — Veri Güvenliği ve Kriptografi
*Data Security & Cryptography*

**Amaç: Veri Mülkiyeti ve Mahremiyetin Teknik Temelleri**

Çok katmanlı bir OS'in en büyük vaadi hız değil, güvendir. Beiwe ve Saule ikilisi, veri güvenliğini sadece yasal bir metin olarak değil, yazılım mimarisinin bir parçası (privacy-by-design) olarak uygular. Gerçekçi güvenlik politikalarımız şunlardır:

### 1. At-Rest ve In-Transit Şifreleme (Saule Core)
Kullanıcının müşterileri, görevleri, notları ve tüm anlamsal hafızası (SML), Saule veritabanında fiziksel olarak saklanırken endüstri standardı **AES-256** ile şifrelenir (Encryption at Rest). İletişim ağı tamamen TLS 1.3 üzerinden sağlanır.

### 2. LLM İletişimi ve Eğitim İzolasyonu (Zero-Data Retention)
Clarity Engine, bağlamı seçilen LLM sağlayıcısına (API üzerinden) aktardığında, kurumsal (Enterprise) anlaşmalı uç noktalar kullanılır. Bu, gönderilen hiçbir şirket verisinin, müşteri notunun veya randevu bilgisinin LLM modellerinin eğitimi için kullanılamayacağı anlamına gelir. Veri, LLM sağlayıcısının sunucusuna gider, işlenir ve kalıcı olarak silinir.

### 3. İstemci Tarafında Şifre Çözme ve Minimum Bağlam (Client-Side Decryption)
Saule (Sunucu) tam bir "Sıfır Bilgi" (Zero-Knowledge) mimarisiyle çalışmayı hedefler. Sunucu, şifrelenmiş verinin içeriğini okumaz; sadece kör yönlendirici (Blind Relay) görevi görür. LLM'e gidecek olan bağlamı sunucu değil, doğrudan şifreleme anahtarlarına sahip olan **İstemci (Beiwe)** hazırlar. İstemci, veritabanının tamamını değil, o anki niyeti çözmek için gereken "minimum bağlamı" seçer, yerel cihazda çözer ve doğrudan LLM'e gönderir. Böylece sunucu, tam veri setini asla düz metin (plaintext) olarak görmez.

### 4. Geçici Bağlam (Ephemeral Context)
Kullanıcının komut çubuğunda yaptığı eşleştirmeler ve anlık arama sorguları, arayüz (Beiwe) üzerinde geçici (ephemeral) olarak tutulur. Tarayıcı sekmesi kapatıldığında veya oturum yenilendiğinde bu state kaybolur. Kalıcı olan tek şey, kullanıcının bilinçli olarak kaydettiği veya onayladığı verilerdir (`ingest` edilenler).

### 5. Air-Gapped / On-Premise Kurulum Mümkünlüğü
En katı veri güvenliği kurallarına sahip şirketler (Sağlık, Finans) için Saule Core mimarisi, tamamen şirketin kendi iç sunucularında (On-Premise) çalışacak şekilde izole edilebilir. Bu kurulumda dış ağ bağlantısı tamamen kesilerek (Air-Gapped) açık kaynaklı yerel LLM modelleri (Örn: Llama 3) kullanılabilir.

---

## Bölüm 12 — İş Modeli ve Ticari Etik
*Business Model & Commercial Ethics*

**Amaç: Şeffaf ve Güvenilir İş Yazılımı**

Beiwe, kullanıcı ve şirket verisini satmaz. Açık kaynak / kendi sunucunda barındırma (Self-hosted) modeline saygı duyar. Ticari varlığını sürdürmek için "güven" ve "kurumsal lisanslama" modellerini kullanır. Beiwe'nin modüler yapısı, şirketlerin sadece ihtiyaç duydukları katmanları (CRM, İK vb.) satın alarak Clarity Engine'i kendi iş akışlarına entegre etmelerini sağlar.

---

## Bölüm 13 — Beiwe Testi
*The Beiwe Test*

**Amaç: Son Süzgeç**

Beiwe bir netlik iddiasıdır. Herhangi bir özellik, ekran ya da satır kod gönderilmeden önce bu testten geçmek zorundadır.

> **Her özellik bu soruları cevaplamalıdır.**

- **Kullanıcının niyetini anlıyor mu?**
- **Menü kalabalığı yaratmadan eylemi çözüyor mu?**
- **Kendini açıklıyor mu?**
- **Bilişsel yükü azaltıyor mu?**
- **Kullanıcının mülkiyetine saygı duyuyor mu?**
- **Geride yararlı bir hafıza bırakıyor mu?**
- **Düşünmeyi ve iş yapmayı kesintiye uğratıyor mu?**
- **Clarity Engine bunu otonom olarak yönetebilir mi?**

**Kural:** Cevaplardan biri bile "Hayır" ise, o özellik gönderilmez.

---

## 📚 Kitabın Son Hali

| Bölüm | Türkçe | English | Amaç |
|---|---|---|---|
| 1 | Beiwe Neden Var? | Why Beiwe Exists | Vizyon |
| 2 | Manifesto | Manifesto | Felsefe |
| 3 | Netlik Modeli | The Clarity Model | Ürün Mantığı |
| 4 | Workspace İlkeleri | Workspace Principles | Çalışma Alanı Davranışı |
| 5 | Ürün İlkeleri | Product Principles | Karar Mekanizması |
| 6 | Tasarım Dili | Design Language | Görsel Sistem |
| 7 | Etkileşim Dili | Interaction Language | Kullanıcı Akışı |
| 8 | Hareket Dili | Motion Language | Animasyon Sistemi |
| 9 | Saule Entegrasyonu | Saule Integration | SML + Beiwe İlişkisi |
| 10 | Teknik Mimari | Technical Architecture | Kod ve Sistem |
| 11 | Veri Güvenliği ve Kriptografi | Data Security & Cryptography | Mahremiyetin Teknik Temelleri |
| 12 | İş Modeli ve Ticari Etik | Business Model & Ethics | Şeffaf Gelir Modeli |
| 13 | Beiwe Testi | The Beiwe Test | Son Süzgeç |

---

*© 2026 PEH Solutions — Книга Beiwe ürünün evrimiyle birlikte "Çok Katmanlı Akıllı Çalışma Alanı" (Workspace/OS) anayasasına dönüştürülmüştür.*
