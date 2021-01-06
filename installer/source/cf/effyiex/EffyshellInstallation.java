package cf.effyiex;

import sun.awt.OSInfo;
import sun.awt.OSInfo.OSType;

import javax.imageio.ImageIO;
import javax.swing.*;
import javax.xml.bind.DatatypeConverter;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

// DOESN'T work with a Mac-PC

public final class EffyshellInstallation extends JFrame {

    public static final EffyshellInstallation INSTANCE = new EffyshellInstallation();

    private static final Runnable[] STEPS = new Runnable[] {
            () -> {
                INSTANCE.jpBar.setValue(0);
                List<File> links = new ArrayList();
                if(INSTANCE.jcbAutostart.isSelected()) links.add(new File(""));
                if(INSTANCE.jcbDesktopLink.isSelected()) links.add(new File(""));
                byte[] buffer = ("pyw " + INSTANCE.jtfPath.getText() + "/Effyshell").getBytes();
                links.forEach(link -> {
                    String name = "/Effyshell.";
                    name += OSInfo.getOSType().equals(OSType.WINDOWS) ? "bat" : "sh";
                    File file = new File(link.getAbsolutePath() + name);
                    if(!file.exists() || !file.isFile()) {
                        try {
                            file.createNewFile();
                            FileOutputStream stream
                                    = new FileOutputStream(file);
                            stream.write(buffer);
                            stream.close();
                        }
                        catch (IOException e) { e.printStackTrace(); }
                    }
                });
                INSTANCE.jpBar.setValue(INSTANCE.jpBar.getValue() + 1);
                EffyshellInstallation.sleep(256L);
            },
            () -> {
                
            }
    };

    private final JPanel panel = new JPanel();
    private final JCheckBox jcbAutostart = new JCheckBox("Autostart at boot.", true);
    private final JCheckBox jcbDesktopLink = new JCheckBox("Desktop-Executable.", true);
    private final JButton jbInstall = new JButton("Install");
    private final JTextField jtfPath = new JTextField();
    private final JLabel jlPath = new JLabel("Installation-Path: ");
    private final JProgressBar jpBar = new JProgressBar(0, STEPS.length);

    private EffyshellInstallation() {
        super("Effyiex's Effyshell Installer");
        Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
        this.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        this.setSize(320, 320);
        this.setLocation((screen.width - this.getWidth()) / 2, (screen.height - this.getHeight()) / 2);
        this.setIconImage(EffyshellInstallation.getFavicon());
        this.setResizable(false);
        this.panel.setLayout(null);
        this.add(panel);
        jlPath.setFont(new Font(jlPath.getFont().getFontName(), Font.PLAIN, 14));
        jtfPath.addActionListener(onEnter -> jbInstall.doClick());
        jlPath.setBounds(24, 64, this.getWidth() - 48, 32);
        jtfPath.setBounds(24, 96, this.getWidth() - 48, 24);
        jbInstall.setBounds(this.getWidth() - 128, this.getHeight() - 64, 96, 48);
        jcbAutostart.setBounds(16, 16, this.getWidth() - 32, 16);
        jcbDesktopLink.setBounds(16, 32, this.getWidth() - 32, 16);
        jpBar.setBounds(24, 128, this.getWidth() - 48, 24);
        jbInstall.addActionListener(onClick -> new Thread(() -> Arrays.asList(STEPS).forEach(step -> step.run())).start());
        this.register(jbInstall, jcbAutostart, jcbDesktopLink, jtfPath, jlPath, jpBar);
        Arrays.asList(panel.getComponents()).forEach(c -> c.setFocusable(false));
        jtfPath.setFocusable(true);
        this.setVisible(true);
    }

    public void register(Component... array) {
        Arrays.asList(array).forEach(c -> this.panel.add(c));
    }

    @Override
    public int getHeight() {
        return super.getHeight() + (OSInfo.getOSType().equals(OSType.WINDOWS) ? -30 : 0);
    }

    private static void sleep(long millies) {
        try { Thread.sleep(millies); }
        catch (InterruptedException e) { return; }
    }

    private static BufferedImage getFavicon() {
        byte[] buffer;
        try(InputStream stream = ClassLoader.getSystemResourceAsStream("favicon")) {
            buffer = new byte[stream.available()];
            stream.read(buffer);
            buffer = DatatypeConverter.parseBase64Binary(new String(buffer));
            ByteArrayInputStream baos = new ByteArrayInputStream(buffer);
            BufferedImage result = ImageIO.read(baos);
            baos.close();
            return result;
        } catch (IOException e) { e.printStackTrace(); }
        return null;
    }

    public static void main(String[] args) {
        return;
    }

}
