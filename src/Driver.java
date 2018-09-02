import javax.swing.*;

public class Driver {

    public static void main(String[] args) {
        JFrame window = new JFrame("Memory Game");
        window.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);

        JPanel panel = new JPanel();
        window.add(panel);

        JButton startGame = new JButton("Start Game");
        panel.add(startGame);

        window.pack();

        window.setVisible(true);
    }
}
