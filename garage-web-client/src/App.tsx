import { Title, Text, Button, Container, Stack } from '@mantine/core';

function App() {
  return (
    <Container p="md">
      <Stack align="center" justify="center" h="100vh">
        <Title order={1}>Garage Web Client</Title>
        <Text size="lg" c="dimmed">
          Initialized with Vite, React, and Mantine UI
        </Text>
        <Button variant="filled" color="blue" onClick={() => console.log('Clicked')}>
          Get Started
        </Button>
      </Stack>
    </Container>
  );
}

export default App;
