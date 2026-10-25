import { fireEvent, render, screen } from '@testing-library/react';
import { assessInjury } from '../api/public';
import Chatbot from './Chatbot';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/assessment' }),
}), { virtual: true });
jest.mock('../api/public', () => ({ assessInjury: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

async function send(text) {
    fireEvent.change(screen.getByRole('textbox', { name: 'Message input' }), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
}

test.each([true, false])('three-question assessment renders database cards and opens clinic (embedded=%s)', async embedded => {
    assessInjury
        .mockResolvedValueOnce({ data: { message: 'Where exactly is the pain?' } })
        .mockResolvedValueOnce({ data: { message: 'How did it happen?' } })
        .mockResolvedValueOnce({ data: { message: 'What is your pain level?' } })
        .mockResolvedValueOnce({ data: {
            assessment_done: true,
            message: 'Based on your symptoms, you likely have: ankle sprain.\n\n---CLINICS---\n{"id":17,"name":"Database clinic","address":"Clinic address","specialty":"Ankle rehabilitation"}\n---END---',
        } });
    render(<Chatbot embedded={embedded} />);
    if (!embedded) fireEvent.click(screen.getByRole('button', { name: 'Open injury assessment chat' }));
    for (const [answer, reply] of [
        ['I hurt my ankle', 'Where exactly is the pain?'],
        ['Outer ankle', 'How did it happen?'],
        ['Rolled it playing football', 'What is your pain level?'],
        ['4 out of 10', 'Database clinic'],
    ]) {
        await send(answer);
        expect(await screen.findByText(reply)).toBeInTheDocument();
    }
    expect(assessInjury).toHaveBeenCalledTimes(4);
    expect(assessInjury.mock.calls[3][0]).toHaveLength(8);
    expect(screen.queryByText(/---CLINICS---/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Database clinic/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/clinics/17');
    fireEvent.click(screen.getByRole('button', { name: /Browse All Clinics/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/clinics');
});

test('assessment without approved clinics still offers browsing', async () => {
    assessInjury.mockResolvedValueOnce({ data: { message: 'Assessment complete.', assessment_done: true } });
    render(<Chatbot embedded />);
    await send('Ankle sprain, pain level 4');
    expect(await screen.findByRole('button', { name: /Browse All Clinics/ })).toBeInTheDocument();
    expect(screen.queryByText('Clinics that treat this')).not.toBeInTheDocument();
});

test.each([
    [{ response: { status: 429, data: { retry_after: 12 } } }, /try again in 12 seconds/],
    [{ response: { status: 503 } }, /couldn't connect or complete/],
    [{ code: 'ECONNABORTED' }, /couldn't connect or complete/],
])('failed assessment retains the answer and retries without duplicate or error history', async (error, errorText) => {
    assessInjury.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: { message: 'Where is the pain?' } });
    render(<Chatbot embedded />);
    await send('My ankle hurts');
    expect(await screen.findByText(errorText)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('My ankle hurts');
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Where is the pain?')).toBeInTheDocument();
    const payload = assessInjury.mock.calls[1][0];
    expect(payload).toHaveLength(2);
    expect(payload[1]).toEqual({ role: 'user', content: 'My ankle hurts' });
    expect(payload.some(msg => msg.content.includes('ready to resend'))).toBe(false);
});
