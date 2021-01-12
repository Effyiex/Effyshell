package cf.effyiex;

import javax.imageio.ImageIO;
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Base64;

public class EffyshellHelper {

    public static final String ICON_64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAA" +
            "Cxjwv8YQUAAAAJcEhZcwAADsEAAA7BAbiRa+0AAAYjSURBVFhH7VdbTFRHGJ6zu1wFVuQiIApICRSBhICKMaWhAYqR1Ft54QWjCYRHk" +
            "z71oYlNEx94aNK+EhIaEvpgjCbYFguoUDFQiCIQASMIclXud5a99PuGM+suLFTTPvolk3PO7Mz83///3z8zKz7iv8JoNGpJSUma/vnB" +
            "+KCJiYmJ2urqqrawsOCzsbERomla6IEDBwLwvW4wGFZ9fHzmw8LCFo8fP76enZ1t9/LycpSUlDj06R7xXgSwmKGnp8eM1yPw9hMgPSg" +
            "o6By+4xEBXzwteK6A0OD6+vpfjx49+m1mZubZ6dOnZ8+cOWPdi8SeBKqrq7Vbt255tbW1HS0uLv4GHn29tLRkfvv2rcBTH/UOdrtdBA" +
            "QEiNjY2A1vb++7NTU116Ojo/tKS0s3r1y54pGERwI0jIcGw1719fWJRUVFPw8PD2fPzc0JhFo2eLs1GHA4HM5GEmyhoaEC0foba11bW" +
            "VnpnJycXNeHu8GoP91w4cIFw9OnT011dXUx58+fr3j58mUeFhEmk8mtkQhC7yTlCo6HNg6dPXs2d2RkpBcpGQUxq/6zEzsI0Pv29nbT" +
            "nTt3jl66dOnG9PT0V4uLixoNIgXSsHoqEvSYEWH4w8PDxfz8vFxrbW1NwHNzXl7eFxMTE61I3Ri63VKxgwA81qqqqswwfh2TimdnZ6V" +
            "xNnq7b98+aSg4OFgcPHhQxMTEiOTkZJGSkiIgTjE6Oir1wXQQqBYBw4FZWVk+ra2tf7JL/qBjBwHk2TQ+Pp568uTJ7xF6f2UcomI1MK" +
            "/i8OHDIiIiQoSEhIjAwEAZEUbg+fPnAlqREXHVhcViYWQih4aGmpCacZhxRmEHAeQquLy8/AYWymAI6TWNnzp1Suzfv18ftSU85pkVg" +
            "TCLgYEBAeKyXwlRESAQFX+UZFxLS8sf+FyWnYC7cgCwPWSz2b588+aN9IoL0Mu+vj4BbeijhHj9+rXo7e0VY2NjkgRDzUi5VocrSBZa" +
            "yo6Pj/8Un85BbgQw2ZCenn4U6g3Qu6TIlpeXBTYYgV1Q7xXC399fht5TBewGRNeYkZGRhFfnBLeZ8FaDqKIYPlcor9hPTwkKkYSsVqs" +
            "kQj3ExcVJYruBkQS80TxHANCQAhOVrnKn0sBGPVAXhK+vrzhx4oSAukVmZqZITU2VlcFQc872puZAT2ThOQKA8QigM3UaVu9ms9lNiB" +
            "SnAoX45MkTSdLVqOsTZS2wNVMDzonbCdiR/ymGURlXjX2s9c3NTX2okDXf3d0tHj9+LPr7+92Me2qMAJyLwFTT1go7CVhxgDQi10uux" +
            "lnHzP3Dhw9FV1eXPlRIYfI3ilAZV6JUTRkncHSzVJ/h1bkZbSfgQAnOos3IDxin8LgQc8+FlAgJesQxCsqop0gQSJmjsbGxAa+7EiB4" +
            "zg4qIZKAalQ8iSijuBPIlPA3PtnP6oiKipKiZGW4RgFpnMPuOoSpzjLzdBpaMdiWm5t7bnBwEK/vwsp3GoFO5abD8qNxngk8BxISEuR" +
            "vkZGRAlGUm5dyAncEniO/d3Z2/ooobpUS4CkCm01NTfcxqYsLcjIXU43fLDWCpLgwT0CmQ4H7A+4STsIUMHbAgcrKyh+wES3owyQ8RY" +
            "BYQ0gnc3Jy8rF9+rnefmiU9U7veUHhNswzgIfQixcv5PbMilBkCZwjjubm5m8RgftXr1613L59W/YTuxGwY8ERLN5TUFDwGdQexDOeH" +
            "nFR1jxyKaampgTuC/L853ZNgdKwCjv3DTjhQETu3rt376eysrI5XFwd70OA2ITghqGD3sLCwnwcTv4q9Ao0pDzlkyLlOxvvCThXph48" +
            "ePAdrnU/5ufnT0AnMiTvS4CKtyK3E0jBK2y7ybhyh6BbQ1qkEUVAkWBjreMu4UA1tN28efMaolZ3+fLlGWjAhrk7rulbBboHKioqtNr" +
            "aWj8cu1EQ0OdYvAgayMKOaWb4KTiWHrdoiM0CEt0dHR2/QO11GDsBzy3QjX23q/m/EiB4T0SeDQ0NDV649ZiR76i0tLRjqJJjKEc/kJ" +
            "gHwVfYJfsRjVHcmKYvXry4gf3g//ljQuhXdULDoaLhfmfAFcsI44iyZkcUbMi7DZfZPQ1+hDuE+AfgspV7wIk+3gAAAABJRU5ErkJggg==";

    private static final int UNIT = 14, SIZE = 256;

    private static final JFrame FRAME = new JFrame("Effyshell Desktop Helper");

    private static final JPanel PANEL = new JPanel() {

        @Override
        protected void paintComponent(Graphics parent) {
            super.paintComponent(parent);
            Graphics2D g = (Graphics2D) parent;
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setStroke(new BasicStroke(3.0F));
            g.setColor(Color.white);
            g.setFont(new Font(g.getFont().getFontName(), Font.PLAIN, UNIT));
            g.drawRect(0, 0, getWidth() - 1, getHeight() - 1);
            g.drawString(FRAME.getTitle(), UNIT * 2, Math.round(UNIT * 1.35F));
            g.drawRect(0, 0, getWidth() - 1, UNIT * 2);
            g.drawImage(EffyshellHelper.convertIcon(), UNIT / 6, UNIT / 6, (int) (UNIT * 1.75F), (int) (UNIT * 1.75F), null);
        }

    };

    private static final MouseListener DRAG_LISTENER = new MouseListener() {

        @Override
        public void mouseClicked(MouseEvent event) {}
        @Override
        public void mouseEntered(MouseEvent event) {}
        @Override
        public void mouseExited(MouseEvent event) {}

        private Point dragging;

        @Override
        public void mousePressed(MouseEvent event) {
            if(event.getY() < UNIT * 2 && event.getButton() == 1)
            new Thread(() -> {
                dragging = FRAME.getMousePosition();
                while(dragging != null) {
                    try {
                        Point global = MouseInfo.getPointerInfo().getLocation();
                        if(global != null && dragging != null)
                        FRAME.setLocation(global.x - dragging.x, global.y - dragging.y);
                        Thread.sleep(1L);
                    }
                    catch (InterruptedException e) { break; }
                }
            }).start();
        }

        @Override
        public void mouseReleased(MouseEvent event) {
            if(event.getButton() == 1) dragging = null;
        }

    };

    public static void main(String[] args) {
        String[] source = EffyshellHelper.class.getProtectionDomain().getCodeSource().getLocation()
                .getPath().replace(String.valueOf('\\'), String.valueOf('/')).split(String.valueOf('/'));
        StringBuffer dirBuffer = new StringBuffer();
        String scriptDir = new String();
        for(String dir : source) {
            dirBuffer.append(dir).append('/');
            if(dirBuffer.toString().endsWith("/Effyshell/"))
            scriptDir = dirBuffer.toString() + "scripts";
        }
        System.out.println(scriptDir);
        File exeScript = new File(scriptDir + "/executable.pyw");
        File uiScript = new File(scriptDir + "/browser.pyw");
        Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
        new ESButton("X", SIZE - UNIT * 2 - 1, 0, UNIT * 2, UNIT * 2 + 1, e -> System.exit(0));
        new ESButton("-", SIZE - UNIT * 4, 0, UNIT * 2, UNIT  * 2, a -> FRAME.setState(1));
        new ESButton("Launch local Server", UNIT, UNIT * 3, SIZE - UNIT * 2, UNIT * 3, a -> open(exeScript));
        new ESButton("Open Web-Interface", UNIT, Math.round(UNIT * 6.75F), SIZE - UNIT * 2, UNIT * 3, a -> open(uiScript));
        new ESButton("Visit Developer", UNIT, Math.round(UNIT * 10.50F),
                SIZE - UNIT * 2, UNIT * 3, a -> visit("https://www.effyiex.cf"));
        new ESButton("Visit Git-Repository", UNIT, Math.round(UNIT * 14.25F),
                SIZE - UNIT * 2, UNIT * 3, a -> visit("https://github.com/Effyiex/Effyshell"));
        FRAME.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
        FRAME.setSize(SIZE, SIZE);
        FRAME.setResizable(false);
        FRAME.setLocation((screen.width - FRAME.getWidth()) / 2, (screen.height - FRAME.getHeight()) / 2);
        FRAME.setUndecorated(true);
        FRAME.setIconImage(EffyshellHelper.convertIcon());
        PANEL.setBackground(Color.black);
        PANEL.setLayout(null);
        FRAME.add(PANEL);
        FRAME.addMouseListener(DRAG_LISTENER);
        FRAME.setVisible(true);
    }

    private static class ESButton extends JButton {

        public ESButton(String text, int x, int y, int width, int height, ActionListener listener) {
            super(text);
            this.setBounds(x, y, width, height);
            this.addActionListener(listener);
            this.setFocusable(false);
            this.setBackground(Color.black);
            this.setFont(new Font(this.getFont().getFontName(), Font.PLAIN, UNIT));
            this.setForeground(Color.white);
            this.setMargin(new Insets(0, 0, 0, 0));
            this.setBorder(BorderFactory.createLineBorder(Color.white, 2));
            PANEL.add(this);
        }

    }

    private static void open(File file) {
        if(Desktop.isDesktopSupported() && file.exists()
                && Desktop.getDesktop().isSupported(Desktop.Action.OPEN)) {
            try { Desktop.getDesktop().open(file); }
            catch (IOException e) { e.printStackTrace(); }
        }
    }

    private static void visit(String site) {
        if(Desktop.isDesktopSupported()
                && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
            try { Desktop.getDesktop().browse(new URI(site)); }
            catch (IOException | URISyntaxException e) { e.printStackTrace(); }
        }
    }

    private static BufferedImage convertIcon() {
        byte[] buffer = Base64.getDecoder().decode(ICON_64);
        BufferedImage icon = null;
        try(InputStream stream = new ByteArrayInputStream(buffer)) {
            icon = ImageIO.read(stream);
        } catch (IOException e) { e.printStackTrace(); }
        return icon;
    }

}
