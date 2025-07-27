import React, { useEffect } from 'react';
import { Box, Typography, Link } from '@mui/material';
import LogoTopLeft from '../TopLeftLogo';
import Footer from '../Footer';

export default function Datenschutz() {
    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);
    return (
        <>
          <LogoTopLeft />
          <Box sx={{ pt: '6rem', px: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Datenschutzerklärung</Typography>

      <Typography variant="h5" gutterBottom>1. Datenschutz auf einen Blick</Typography>
      <Typography variant="subtitle1" gutterBottom>Allgemeine Hinweise</Typography>
      <Typography paragraph>
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Datenerfassung auf dieser Website</Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Wie erfassen wir Ihre Daten?</strong><br />
        Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
        Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Wofür nutzen wir Ihre Daten?</strong><br />
        Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können, werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige Auftragsanfragen verarbeitet.
      </Typography>
      <Typography variant="body1" gutterBottom>
        <strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong><br />
        Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
        Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an uns wenden.
      </Typography>

      <Typography variant="h5" gutterBottom>2. Hosting</Typography>
      <Typography variant="subtitle1" gutterBottom>Externes Hosting</Typography>
      <Typography paragraph>
        Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters / der Hoster gespeichert. Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website generiert werden, handeln.
      </Typography>
      <Typography paragraph>
        Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
      </Typography>
      <Typography paragraph>
        Unser(e) Hoster wird bzw. werden Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten befolgen.
      </Typography>
      <Typography paragraph>
        <strong>Wir setzen folgende(n) Hoster ein:</strong><br />
        340 S Lemon Ave #4133, Walnut, CA 91789, United States
      </Typography>
      <Typography paragraph>
        <strong>Auftragsverarbeitung</strong><br />
        Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben genannten Dienstes geschlossen. Hierbei handelt es sich um einen datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter Einhaltung der DSGVO verarbeitet.
      </Typography>

      <Typography variant="h5" gutterBottom>3. Allgemeine Hinweise und Pflichtinformationen</Typography>
      <Typography paragraph>
        <strong>Datenschutz</strong><br />
        Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
      </Typography>
      <Typography paragraph>
        Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
      </Typography>
      <Typography paragraph>
        Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Hinweis zur verantwortlichen Stelle</Typography>
      <Typography paragraph>
        Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
        Herrn Leonhard Götz, Stünzbach 4a, 84172 Buch am Erlbach<br />
        Herrn Konrad Blersch, Wahlenstraße 27, 93047 Regensburg<br />
        Telefon: 17672910739<br />
        E-Mail: <Link href="mailto:gutscheinfabrik@gmail.com">gutscheinfabrik@gmail.com</Link>
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Speicherdauer</Typography>
      <Typography paragraph>
        Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>Allgemeine Hinweise zu den Rechtsgrundlagen</Typography>
      <Typography paragraph>
        Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung personenbezogener Daten in Drittstaaten erfolgt die Verarbeitung außerdem auf Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies oder in den Zugriff auf Informationen in Ihr Endgerät (z. B. via Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1 lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser Datenschutzerklärung informiert.
      </Typography>

      <Typography variant="h5" gutterBottom>Empfänger von personenbezogenen Daten</Typography>
      <Typography paragraph>
        Innerhalb unseres Unternehmens erhalten nur diejenigen Stellen Ihre personenbezogenen Daten, die diese zur Erfüllung unserer vertraglichen und gesetzlichen Pflichten benötigen. Daten werden nicht an Dritte weitergegeben, außer es besteht eine gesetzliche Verpflichtung dazu oder Sie haben eingewilligt.
      </Typography>

      <Typography variant="h5" gutterBottom>Widerruf Ihrer Einwilligung zur Datenverarbeitung</Typography>
      <Typography paragraph>
        Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
      </Typography>

      <Typography variant="h5" gutterBottom>Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</Typography>
      <Typography paragraph>
        Wenn die Datenverarbeitung auf Grundlage von berechtigten Interessen erfolgt, haben Sie das Recht, Widerspruch gegen die Datenverarbeitung einzulegen, soweit dafür Gründe vorliegen, die sich aus Ihrer besonderen Situation ergeben. Im Falle von Direktwerbung haben Sie ein generelles Widerspruchsrecht, das ohne Angabe einer besonderen Situation ausgeübt werden kann.
      </Typography>

      <Typography variant="h5" gutterBottom>Beschwerderecht bei der zuständigen Aufsichtsbehörde</Typography>
      <Typography paragraph>
        Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt.
      </Typography>

      <Typography variant="h5" gutterBottom>Recht auf Datenübertragbarkeit</Typography>
      <Typography paragraph>
        Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an Dritte in einem gängigen, maschinenlesbaren Format aushändigen zu lassen.
      </Typography>

      <Typography variant="h5" gutterBottom>Auskunft, Berichtigung und Löschung</Typography>
      <Typography paragraph>
        Sie haben das Recht, unentgeltlich Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten. Außerdem haben Sie das Recht auf Berichtigung unrichtiger Daten sowie auf die Löschung Ihrer personenbezogenen Daten, soweit dem keine gesetzliche Aufbewahrungspflicht entgegensteht.
      </Typography>

      <Typography variant="h5" gutterBottom>Recht auf Einschränkung der Verarbeitung</Typography>
      <Typography paragraph>
        Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen, wenn die Richtigkeit der Daten von Ihnen bestritten wird, die Verarbeitung unrechtmäßig ist, Sie aber deren Löschung ablehnen, wir die Daten für die Zwecke der Verarbeitung nicht länger benötigen, Sie jedoch diese zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen oder Sie Widerspruch gegen die Verarbeitung eingelegt haben.
      </Typography>

      <Typography variant="h5" gutterBottom>4. Datenerfassung auf dieser Website – Cookies</Typography>
      <Typography paragraph>
        Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
      </Typography>
      <Typography paragraph>
        Die meisten der von uns verwendeten Cookies sind so genannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
      </Typography>
      <Typography paragraph>
        Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
      </Typography>
      <Typography paragraph>
        Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs oder zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z. B. Warenkorbfunktion) erforderlich sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Sofern eine ausdrückliche Einwilligung (z. B. eine Einwilligung zur Speicherung von Cookies) abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO; die Einwilligung ist jederzeit widerrufbar.
      </Typography>

      <Typography variant="h5" gutterBottom>Anfrage per E-Mail, Telefon oder Telefax</Typography>
      <Typography paragraph>
        Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
      </Typography>
      <Typography paragraph>
        Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO).
      </Typography>
      <Typography paragraph>
        Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.
      </Typography>
      </Box>
      <Footer />
    </>
  );
}
